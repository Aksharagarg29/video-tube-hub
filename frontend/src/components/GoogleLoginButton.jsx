import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function GoogleLoginButton({ onSuccess, onError }) {
    const googleButtonRef = useRef(null);
    const { googleLogin } = useAuth();

    // Signup/Login pass inline arrow functions for onSuccess/onError, so a
    // new function identity arrives on every render (e.g. every keystroke).
    // Keeping them in refs lets the callback below always call the latest
    // version without re-running the effect and re-initializing Google's
    // SDK each time (that re-init is what GSI_LOGGER was warning about).
    const googleLoginRef = useRef(googleLogin);
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        googleLoginRef.current = googleLogin;
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
    }, [googleLogin, onSuccess, onError]);

    useEffect(() => {
        const initializeGoogle = () => {
            if (!window.google || !googleButtonRef.current) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

                callback: async (response) => {
                    try {
                        await googleLoginRef.current(response.credential);

                        if (onSuccessRef.current) {
                            onSuccessRef.current();
                        }
                    } catch (error) {
                        if (onErrorRef.current) {
                            onErrorRef.current(
                                error.response?.data?.message ||
                                "Google login failed. Please try again."
                            );
                        }
                    }
                },
            });

            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                {
                    theme: "outline",
                    size: "large",
                    width: 320,
                    text: "continue_with",
                    shape: "rectangular",
                }
            );
        };

        if (window.google) {
            initializeGoogle();
        } else {
            const interval = setInterval(() => {
                if (window.google) {
                    clearInterval(interval);
                    initializeGoogle();
                }
            }, 100);

            return () => clearInterval(interval);
        }
        // Runs once on mount — initialize()/renderButton() should only ever
        // happen a single time per mounted button, regardless of how many
        // times the parent re-renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={googleButtonRef}
            className="flex justify-center"
        />
    );
}