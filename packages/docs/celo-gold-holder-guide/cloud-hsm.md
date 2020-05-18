# Using a Cloud HSM

A cloud Hardware Security Module (HSM) provides a good balance between security and accessibility. A cloud HSM can manage a Celo private key and can be used seamlessly with `celocli` and `contractkit`. Similar to a ledger device, a key in an HSM is more secure than an in-memory key since the key can never leave the hardware boundary and all signing is performed remotely. To authenticate to the HSM, it's recommended to create a service principal account that has been granted access to sign with the managed keys. A cloud HSM can be a great option for managing voting keys, since you may want these accounts to be portable but still desire to maintain good security practices. This guide will walk you through creating a cloud HSM in Azure and connecting it to `celocli`. 

## Create an Azure subscription

If you don't have an Azure subscription already, you can [create a free trial here](https://azure.microsoft.com/free/) that starts with $200 credit. You can [view the pricing for ECC HSM keys here](https://azure.microsoft.com/pricing/details/key-vault/).

## Deploy your Azure Key Vault

The Key Vault can store keys, secrets, and certificates. Permission can be specified to perform certain actions across the entire Key Vault (ex. key signing).
- Search the marketplace for "Key Vault"
- Click Create and fill out the deployment information
- Ensure you select the Premium pricing tier for HSM support
- Enable soft-delete and purge protection to ensure your keys aren't accidentally deleted

## Create your key

Next, we'll create the ECDSA key. 
- Navigate to your newly created Key Vault and click on the `Keys` section. 
- Click on "Generate/Import"
- Select "EC-HSM"
- Select "SECP256K1"

You'll see your newly generated key listed in the `Keys` section.

```bash
# On your local machine
export AZURE_VAULT_NAME=<VAULT-NAME>
export AZURE_KEY_NAME=<KEY-NAME>
```

## Create a Service Principal

A Service Principal (SP) is preferred over your personal account so that permission can be heavily restricted. In general, Service Principal accounts should be used for any automation or services that need to access Azure resources.

Use the [Cloud Shell](https://shell.azure.com/bash) to create the client credentials.

Create a service principal and configure its access to Azure resources:

```bash
# In the Cloud Shell
az ad sp create-for-rbac -n <your-application-name> --skip-assignment
```

The account will be created and will output the account's credentials

```bash
{
  "appId": "generated-app-ID",
  "displayName": "dummy-app-name",
  "name": "http://dummy-app-name",
  "password": "random-password",
  "tenant": "tenant-ID"
}
```

Set these as environment variables so that they can be used by `celocli` or `contractkit`.

```bash
# On your local machine
export AZURE_CLIENT_ID=<GENERATED-APP-ID>
export AZURE_CLIENT_SECRET=<PASSWORD>
export AZURE_TENANT_ID=<TENANT-ID>
```

## Grant your Service Principal access to the key

In the Cloud Shell or Access Policies pane of the Key Vault, set the [GET, LIST, SIGN] permission for the new account.

```bash
# In the Cloud Shell
az keyvault set-policy --name <your-key-vault-name> --spn $AZURE_CLIENT_ID --key-permissions get list sign
```

## Run CeloCLI

Now that your environment variables are set, we just need to let `celocli` know that we want to use this Key Vault wallet. We do this by passing in the flag `--useAKV` and `--azureVaultName`. Similar to `--useLedger`, all CLI commands will use the HSM signer when `--useAKV` is specified.

```bash
# On your local machine
celocli account:list --useAKV --azureVaultName $AZURE_VAULT_NAME
```

Your Key Vault address will show up under "Local Addresses".

## Connecting ContractKit to KeyVault

To leverage your HSM keys in `contractkit`, first create an `AzureHSMWallet` object and use it to create a `ContractKit` object with `newKitFromWeb3`. Note that `AzureHSMWallet` expects AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID environment variables to be specified.

```js
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { AzureHSMWallet } from '@celo/contractkit/lib/wallets/azure-hsm-wallet'

const azureVaultName = "AZURE-VAULT-NAME"
const akvWallet = await new AzureHSMWallet(azureVaultName)
await akvWallet.init()
console.log(`Found addresses: ${await akvWallet.getAccounts()}`)
const contractKit = newKitFromWeb3(this.web3, akvWallet)
```
