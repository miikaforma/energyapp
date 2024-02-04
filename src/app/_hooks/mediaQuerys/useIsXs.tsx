import { useMediaQuery, useTheme } from '@mui/material'

export default function useIsXs() {
    const theme = useTheme()
    const isXs = useMediaQuery(theme.breakpoints.down('md'))
    return isXs
}
