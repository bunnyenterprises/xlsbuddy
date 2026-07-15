import React, { useEffect, useRef } from "react";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({ onCredential, label = "signin_with" }) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (res) => onCredential(res.credential),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          text: label,
          width: btnRef.current.offsetWidth || 400,
          logo_alignment: "center",
        });
      }
    };

    // Load GIS script if not already present
    if (window.google?.accounts?.id) {
      init();
    } else {
      const existing = document.getElementById("gsi-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = init;
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", init);
      }
    }
  }, [onCredential, label]);

  if (!CLIENT_ID) return null;

  return (
    <div className="w-full flex justify-center">
      <div ref={btnRef} className="w-full" style={{ minHeight: 44 }} />
    </div>
  );
}
