import { Colors } from '@/constants/Colors';
import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

const LoginImage: React.FC<SvgProps> = (props) => {
  return (
    <Svg width={75} height={87} viewBox="0 0 75 87" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 23.368v63.235l20.238-11.685V41.313L0 23.368zm20.238 8.42V11.684L0 0v13.832l20.238 17.956zm43.814 17.834L75 43.302 27.38 15.807v54.986l13.096-7.56V36.01l23.576 13.612z"
        fill={Colors.blueColor}
      />
    </Svg>
  );
};

export default LoginImage;
