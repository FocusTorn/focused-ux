
// Component with error
import React from 'react'

interface ErrorComponentProps {
    message: string
    count: number
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({ message, count }) => {
    // Intentional error: using count as string
    const displayCount = count.toUpperCase()
    
    return (
        <div>
            <p>{message}</p>
            <p>Count: {displayCount}</p>
        </div>
    )
}

export default ErrorComponent
