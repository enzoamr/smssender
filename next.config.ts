import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (et ses dépendances comme jose/jwks-rsa) ne doit pas être
  // bundlé : on le charge comme module Node natif côté serveur. Sinon le
  // bundler résout `jose` en ESM puis fait un require() dessus -> ERR_REQUIRE_ESM.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
