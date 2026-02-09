import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

export type IconSet = 'MaterialIcons' | 'Ionicons' | 'Feather';

export type IconProps = {
  iconName: string;
  iconSet?: IconSet;
  size?: number;
  color?: string;
};

const setMap = {
  MaterialIcons,
  Ionicons,
  Feather,
};

export const Icon: React.FC<IconProps> = ({
  iconName,
  iconSet = 'MaterialIcons',
  size = 20,
  color = '#000',
}) => {
  const IconComponent = setMap[iconSet];
  return <IconComponent name={iconName} size={size} color={color} />;
};
