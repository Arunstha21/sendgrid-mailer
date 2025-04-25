"use server";

import connect from "@/lib/database/connect";
import { ResultDiscordDB, UserDB } from "@/lib/database/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface User {
  id: string;
  userName: string;
  email: string;
  superUser: boolean;
  isDiscordResult: boolean;
}

connect();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiration = process.env.JWT_EXPIRATION || "1h"; // Default to 20 minutes


// Fetch the user profile from the JWT token in cookies
const GetProfileData = async (): Promise<User> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }

  if (!token) {
    console.log("No token found in cookies.");
    redirect("/");
  }

  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    return decodedToken as User;
  } catch (error: any) {
    console.log("JWT verification error:", error.message);
    redirect("/");

    // Return fallback empty user (Optional for type safety)
    return {
      id: "",
      userName: "",
      email: "",
      superUser: false,
      isDiscordResult: false,
    };
  }
};

// Handle user login
async function login(userName: string, password: string) {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }
  

  const userExists = await UserDB.findOne({ userName });
  if (!userExists) {
    return { status: "error", message: "User Name or Password didn't match" };
  }

  const passwordMatch = await bcrypt.compare(password, userExists.password);
  if (!passwordMatch) {
    return { status: "error", message: "User Name or Password didn't match" };
  }


  const payload = {
    id: userExists._id,
    userName: userExists.userName,
    email: userExists.email,
    superUser: userExists.superUser,
    isDiscordResult: userExists.isDiscordResult || false,
  };
  
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiration });
  const cookieStore = await cookies();


  cookieStore.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 40 * 60, // 40 minutes in seconds
    sameSite: "strict",
  });

  return { status: "success", message: "User logged in" };
}

async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/");
}

async function addUser(userName: string, email: string, password: string, superUser: boolean) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserDB.create({
      userName,
      email,
      password: hashedPassword,
      superUser,
    });
    const userData = {
      id: user._id.toString(),
      userName: user.userName,
      email: user.email,
      superUser: user.superUser,
      isDiscordEnabled: user.isDiscordResult || false,
    };
    return { status: "success", message: userData };
  } catch (error: any) {
    console.log("Error in adding user:", error.message);
    return { status: "error", message: error.message };
  }

}

async function changePassword(userName: string, oldPassword: string, newPassword: string) {
  const user = await UserDB.findOne({userName});
  if (!user) {
    return { status: "error", message: "User not found" };
  }
  
  const passwordMatch = await bcrypt.compare(oldPassword, user.password);
  if (!passwordMatch) {
    return { status: "error", message: "Old password didn't match" };
  }

  const oldPasswordMatch = await bcrypt.compare(newPassword, user.password);
  if (oldPasswordMatch) {
    return { status: "error", message: "New password should be different from the old password" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  return { status: "success", message: "Password changed successfully" };
}

async function changeEmail(userName: string, newEmail: string) {
  const user = await UserDB.findOne({userName});
  if (!user) {
    return { status: "error", message: "User not found" };
  }

  user.email = newEmail;
  const cookieStore = await cookies();
  updateCookie(cookieStore, newEmail);

  await user.save();
  return { status: "success", message: "Email changed successfully" };
}

async function discordFeature(userName: string, enable: boolean){
try {
    const user = await UserDB.findOne({userName});
    if (!user) {
      return { status: "error", message: "User not found" };
    }
    user.isDiscordResult = enable;
    const cookieStore = await cookies();
    updateCookie(cookieStore, undefined, enable);

    await user.save();
    return { status: "success", message: "Discord feature updated successfully" };
} catch (error: any) {
    console.log("Error in updating Discord feature:", error.message);
    return { status: "error", message: error.message };
  }
}

async function getDiscordData(userId: string) {
try {
    const discordData = await ResultDiscordDB.findOne({ userId });
    if (!discordData) {
      return { status: "error", message: "Discord data not found", data: {
        guildId: "",
        channelId: "",
        adminGuildId: "",
        adminChannelId: "",
        adminOverallChannelId: "",
      } };
    }
  
    return {
      status: "success",
      message: "Discord data fetched successfully",
      data: {
        guildId: discordData.guildId,
        channelId: discordData.channelId,
        adminGuildId: discordData.adminGuildId,
        adminChannelId: discordData.adminChannelId,
        adminOverallChannelId: discordData.adminOverallChannelId,
      }
    };
} catch (error: any) {
    console.log("Error in fetching Discord data:", error.message);
    return { status: "error", message: error.message, data: {
      guildId: "",
      channelId: "",
      adminGuildId: "",
      adminChannelId: "",
      adminOverallChannelId: "",
    } };
  }
  
}

async function setDiscordData(userId: string, guildId: string, channelId: string, adminGuildId: string, adminChannelId: string, adminOverallChannelId: string) {
try {
    const discordData = await ResultDiscordDB.findOne({ userId });
    if (discordData) {
      discordData.guildId = guildId;
      discordData.channelId = channelId;
      discordData.adminGuildId = adminGuildId;
      discordData.adminChannelId = adminChannelId;
      discordData.adminOverallChannelId = adminOverallChannelId;
      await discordData.save();
    } else {
      await ResultDiscordDB.create({
        userId,
        guildId,
        channelId,
        adminGuildId,
        adminChannelId,
        adminOverallChannelId,
      });
    }
    return { status: "success", message: "Discord data saved successfully" };
  } catch (error: any) {
    console.log("Error in saving Discord data:", error.message);
    return { status: "error", message: error.message };
  }
}

function updateCookie(cookieStore:any, newEmail?:string, isDiscordEnabled?:boolean) {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in the environment variables.");
  }
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { status: 'error', message: 'No token found in cookies, cannot update token.' };
  }

  // Decode token without verifying signature to get `exp`
  const decodedToken: any = jwt.decode(token);
  if (!decodedToken || !decodedToken.exp) {
    return { status: 'error', message: 'Failed to decode token, cannot retrieve expiration.' };
  }

  // Calculate remaining time (exp - current time) to preserve maxAge
  const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
  const remainingSeconds = decodedToken.exp - currentTime;
  if (remainingSeconds <= 0) {
    return { status: 'error', message: 'Token already expired, please log in again.' };
  }

  // Create new token with updated email and same payload
  const updatedPayload = {
    id: decodedToken.id,
    userName: decodedToken.userName,
    email: newEmail || decodedToken.email,
    superUser: decodedToken.superUser,
    isDiscordResult: isDiscordEnabled || decodedToken.isDiscordResult,
  };

  const newToken = jwt.sign(updatedPayload, jwtSecret, { expiresIn: remainingSeconds });

  // Set new token with the exact same maxAge as remaining lifetime
  cookieStore.set('token', newToken, {
    httpOnly: true,
    path: '/',
    maxAge: remainingSeconds, // keep it in sync with JWT exp
    sameSite: 'strict',
  });
}

export { login, GetProfileData, logout, addUser, changePassword, changeEmail, discordFeature, getDiscordData, setDiscordData };
