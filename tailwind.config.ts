import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx", "./node_modules/flowbite-react/lib/**/*.js", "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      zIndex: {
        '2000': '2000',
      },
      minHeight: {
        'screen-nhf': 'calc(100vh - var(--header-height) - var(--footer-height))',
      },
    },
    darkMode: 'class',
  },
  plugins: [
    require('flowbite/plugin')({
      charts: true,
    })
  ],
} satisfies Config;
