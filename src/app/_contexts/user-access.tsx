'use client';

import { IUserAccessResponse } from '@energyapp/shared/interfaces';
import { ReactNode } from 'react';
import { createContext, useContext } from 'react';

interface IUserAccessContextValues {
    userAccesses: IUserAccessResponse[];
}

export const UserAccessContext = createContext<IUserAccessContextValues>({
    userAccesses: []
});

export function useUserAccess() {
    return useContext(UserAccessContext);
}

interface UserAccessProviderProps {
    children: ReactNode;
    userAccesses: IUserAccessResponse[]; // replace with your user access data type
}

export function UserAccessProvider({ children, userAccesses }: UserAccessProviderProps) {
    return (
        <UserAccessContext.Provider value={{ userAccesses }}>
            {children}
        </UserAccessContext.Provider>
    );
}