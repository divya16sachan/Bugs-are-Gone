export const USER_AVATARS = [
  "/user-avatars/1_boy.png",
  "/user-avatars/1_girl.png",
  "/user-avatars/2_boy.png",
  "/user-avatars/2_girl.png",
  "/user-avatars/3_boy.png",
  "/user-avatars/3_girl.png",
  "/user-avatars/4_boy.png",
  "/user-avatars/4_girl.png",
  "/user-avatars/5_boy.png",
  "/user-avatars/5_girl.png",
  "/user-avatars/6_boy.png",
  "/user-avatars/6_girl.png",
  "/user-avatars/7_boy.png",
  "/user-avatars/7_girl.png",
  "/user-avatars/8_boy.png",
  "/user-avatars/8_girl.png",
  "/user-avatars/9_boy.png",
  "/user-avatars/9_girl.png",
  "/user-avatars/10_boy.png",
  "/user-avatars/10_girl.png",
  "/user-avatars/11_boy.png",
  "/user-avatars/11_girl.png",
  "/user-avatars/12_boy.png",
] as const;

/**
 * Deterministically maps a given userId (or email) to a consistent avatar from `/public/user-avatars/`
 */
export function getUserAvatar(seed?: string | null, fallbackSeed?: string | null): string {
  const key = (seed && seed.trim()) || (fallbackSeed && fallbackSeed.trim()) || "default_user";
  
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % USER_AVATARS.length;
  return USER_AVATARS[index];
}
