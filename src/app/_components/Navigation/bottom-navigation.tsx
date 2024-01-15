'use client'

import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import EuroIcon from '@mui/icons-material/Euro';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import SettingsIcon from '@mui/icons-material/Settings';
import Paper from '@mui/material/Paper';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link'
import { Session } from 'next-auth';

export default async function BottomNav({ children, session }: { children: ReactNode, session: Session | null }) {
    const pathname = usePathname()

    let currentRoute = "/";
    if (pathname) {
        let pathArray = pathname.split('/');
        if (pathArray.length > 1 && pathArray[1]) {
            currentRoute = '/' + pathArray[1];
        }
    }

    return (
        <Box sx={{ pb: 7, pt: 0 }}>
        <CssBaseline />
        {children}
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1071 }} elevation={3}>
            <BottomNavigation
                showLabels
                value={currentRoute}
                sx={{ overflowX: 'auto' }}
            >
                <BottomNavigationAction sx={{ minWidth: "60px" }} label="Tuntihinnat" href="/" value="/" icon={<EuroIcon />} LinkComponent={Link} />
                {session && <BottomNavigationAction sx={{ minWidth: "60px" }} label="Kulutus" href="/consumptions" value="/consumptions" icon={<ElectricBoltIcon />} LinkComponent={Link} />}
                {session && <BottomNavigationAction sx={{ minWidth: "60px" }} label="Tuotto" href="/productions" value="/productions" icon={<SolarPowerIcon />} LinkComponent={Link} />}
                <BottomNavigationAction sx={{ minWidth: "60px" }} label="Tilastot" href="/statistics" value="/statistics" icon={<StackedLineChartIcon />} LinkComponent={Link} />
                <BottomNavigationAction sx={{ minWidth: "60px" }} label="Asetukset" href="/settings" value="/settings" icon={<SettingsIcon />} LinkComponent={Link} />
            </BottomNavigation>
        </Paper>
    </Box>
    );
}