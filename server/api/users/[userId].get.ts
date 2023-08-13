import { Client } from "../../utils/database.js";

const client = new Client();
export default defineEventHandler(async (e) => {
  const auth = getHeader(e, "Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    // Not a valid auth token
    throw createError({
      statusCode: 401,
      statusText: "Not logged in.",
    });
  } else {
    const token = auth.slice(7);
    const jwtPayload = await verifyJwt(token);
    if (!jwtPayload || (Date.now() / 1000) > jwtPayload.exp) {
      throw createError({
        statusCode: 401,
        statusText: "Session expired. Please login again.",
      });
    }
    if (Number(jwtPayload.level) < 2) {
      throw createError({
        statusCode: 401,
        statusText: "You do not have permission.",
      });
    }
    const userId = getRouterParam(e, "userId");
    const user = await client.prisma.mentors.findFirst({
      where: { user_id: Number(userId) },
    });
    if (user) {
      const mentees = await client.prisma.mentees.findMany({
        where: { mentor: user },
      });
      return {
        id: user.user_id,
        username: user.user_name,
        level: user.user_level,
        mentees,
      };
    } else {
      throw createError({
        statusCode: 404,
      });
    }
  }
});
