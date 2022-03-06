import NextAuth from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import spotifyApi, { LOGIN_URL } from "../../../lib/spotify"
import 'dotenv/config'

async function refreshAccessToken(token) {
    try {
        spotifyApi.setAccessToken(token.accessToken);
        spotifyApi.setRefreshToken(token.refreshToken);

        const { body: refrehedToken } = await spotifyApi.refreshAccessToken();

        console.log(refrehedToken);

        return {
            ...token,
            accessToken: refrehedToken.access_token,
            accessTokenExpires: Date.now() + refrehedToken.expires_in * 1000,
            refreshToken: refrehedToken.refresh_token ?? token.refreshToken
        }
        
    } catch (error) {
        console.error(error);
        return {
            ...token, 
            error: 'RefreshAccessTokenError'
        }
    }
}

export default NextAuth({
    providers: [
        SpotifyProvider({
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
            clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
            authorization: LOGIN_URL
        })
    ],
    secret:  process.env.JWT_SECRET,
    pages: {
        signIn: '/login'
    },
    callbacks: {
        async jwt({token, account, user}) {
            // Initial signIn
            if(account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    username: account.providerAccountId,
                    accessTokenExpires: account.expires_in * 1000
                }    
            }    
            
            // Check if token still valid
            if(Date.now() < token.accessTokenExpires){
                console.log("Access token still valid...")
                return token;
            }

            // Refresh token
            console.log("Access token has expired...")    
            return await refreshAccessToken(token);
        },

        async session({session, token}) {
            session.user.accessToken = token.accessToken;
            session.user.refreshToken = token.refreshToken;
            session.user.username = token.username;

            return session;
        }
    }
});