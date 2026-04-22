export function base64Encode(str) {
    const bytes = new TextEncoder().encode(String(str));
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
