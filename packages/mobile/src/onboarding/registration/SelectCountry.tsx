import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import SearchInput from '@celo/react-components/components/SearchInput'
import colors from '@celo/react-components/styles/colors.v2'
import { LocalizedCountry } from '@celo/utils/src/countries'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSafeArea } from 'react-native-safe-area-view'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import SelectCountryItem from 'src/onboarding/registration/SelectCountryItem'

const keyExtractor = (item: LocalizedCountry) => item.alpha2

type Props = StackScreenProps<StackParamList, Screens.SelectCountry>

export default function SelectCountry({ navigation, route }: Props) {
  const { countries, selectedCountryCodeAlpha2 } = route.params
  const { t } = useTranslation(Namespaces.accountScreen10)
  const [searchText, setSearchText] = useState('')

  const filteredCountries = useMemo(() => countries.getFilteredCountries(searchText), [
    countries,
    searchText,
  ])

  function onSelect(country: LocalizedCountry) {
    navigation.navigate(Screens.JoinCelo, { selectedCountryCodeAlpha2: country.alpha2 })
  }

  const renderItem = useCallback(
    ({ item: country }: { item: LocalizedCountry }) => (
      <SelectCountryItem
        country={country}
        onSelect={onSelect}
        isSelected={country.alpha2 === selectedCountryCodeAlpha2}
        testID={`Country_${country.alpha2}`}
      />
    ),
    [selectedCountryCodeAlpha2]
  )

  const inset = useSafeArea()

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <SearchInput
          placeholder={t('global:search')}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <FlatList
        contentContainerStyle={{ paddingBottom: inset.bottom }}
        keyboardShouldPersistTaps={true}
        style={styles.container}
        data={filteredCountries}
        extraData={selectedCountryCodeAlpha2}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
      <KeyboardSpacer />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.light,
  },
})
