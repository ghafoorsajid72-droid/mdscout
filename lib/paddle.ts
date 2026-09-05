import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;
let paddlePromise: Promise<Paddle | undefined> | undefined;

export async function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return paddleInstance;
  if (paddlePromise) return paddlePromise;

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    console.error("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");
    return undefined;
  }

  const env = process.env.NEXT_PUBLIC_PADDLE_ENV;
  const environment = env === "production" ? "production" : "sandbox";

  paddlePromise = initializePaddle({
    token,
    environment,
  }).then((instance) => {
    if (instance) paddleInstance = instance;
    return instance;
  });

  return paddlePromise;
}
