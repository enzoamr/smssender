import { NextResponse } from "next/server";

/**
 * Erreurs de l'API publique.
 * Les codes HTTP suivent la convention du marché (cf. TopMessage) :
 *  400 invalid_request · 401 unauthorized · 402 insufficient_balance
 *  403 forbidden · 404 not_found · 429 rate_limited · 5xx server_error
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** Transforme une exception en réponse JSON normalisée pour l'API. */
export function apiErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { error: { code: "server_error", message: "Erreur interne du serveur." } },
    { status: 500 },
  );
}
