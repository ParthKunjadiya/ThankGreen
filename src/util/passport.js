const passport = require("passport");
const { getUserData, insertUser } = require("../repository/user");
const passportGoogle = require("passport-google-oauth2").Strategy;

const GoogleStrategy = passportGoogle.Strategy;

const useGoogleStrategy = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
                clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
                callbackURL:
                    process.env.NODE_TEST === "production"
                        ? "https://thankgreen.onrender.com/api/auth/google/callback"
                        : "http://localhost:3000/api/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let email = profile.emails[0].value;
                    let [user] = await getUserData({ email });
                    if (!user || user.length === 0) {
                        let fromGoogle = 1;
                        let name = profile.given_name;
                        [user] = await insertUser({ name, email, fromGoogle });
                    }
                    done(null, user);
                } catch (error) {
                    done(error);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        const id = user.insertId ? user.insertId : user[0].id;
        done(null, id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const [user] = await getUserData({ id });
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
}

module.exports = { useGoogleStrategy }