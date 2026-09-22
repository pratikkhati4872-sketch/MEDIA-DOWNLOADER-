const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const apiUrl = configuredApiUrl || (
    typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? 'https://format-studio-api.onrender.com'
        : 'http://localhost:8000'
);
