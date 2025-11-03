/**
 * Type declarations for react-native-country-codes-picker
 * Fixes JSX namespace errors in the library
 */

declare module 'react-native-country-codes-picker' {
  import { ComponentType } from 'react';
  import { StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface CountryCode {
    code: string;
    dial_code: string;
    flag: string;
    name: Record<string, string>;
  }

  export interface CountryPickerProps {
    show: boolean;
    pickerButtonOnPress: (item: CountryCode) => void;
    onBackdropPress?: () => void;
    style?: {
      modal?: StyleProp<ViewStyle>;
      backdrop?: StyleProp<ViewStyle>;
      line?: StyleProp<ViewStyle>;
      itemsList?: StyleProp<ViewStyle>;
      textInput?: StyleProp<TextStyle>;
      countryButtonStyles?: StyleProp<ViewStyle>;
      dialCode?: StyleProp<TextStyle>;
      countryName?: StyleProp<TextStyle>;
      flag?: StyleProp<TextStyle>;
    };
    searchMessage?: string;
    lang?: string;
    enableModalAvoiding?: boolean;
    androidWindowSoftInputMode?: string;
    popularCountries?: string[];
    excludedCountries?: string[];
    inputPlaceholder?: string;
    searchInputStyle?: StyleProp<TextStyle>;
    itemTemplate?: ComponentType<{ item: CountryCode; onPress: (item: CountryCode) => void }>;
  }

  const CountryPicker: ComponentType<CountryPickerProps>;
  export default CountryPicker;
  export { CountryPicker };
}
