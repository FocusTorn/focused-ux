
// Frontend component: workspace1/src/components/Header.tsx
import React from 'react'

export interface HeaderProps {
    title: string
    user?: string
}

export const Header: React.FC<HeaderProps> = ({ title, user }) => {
    return (
        <header>
            <h1>{title}</h1>
            {user && <span>Welcome, {user}</span>}
        </header>
    )
}

export default Header
