// // ===================================
// // NEXT.JS BACKEND SYSTEM WITH REDIS
// // ===================================

// // Install dependencies:
// // npm install ioredis bcrypt jsonwebtoken

// // ===================================
// // 1. lib/redis.js - Redis Configuration
// // ===================================

// import Redis from 'ioredis';

// const redis = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD,
//   db: 0,
// });

// export default redis;

// // ===================================
// // 2. lib/keys.js - Redis Key Patterns
// // ===================================

// export const KEYS = {
//   user: (userId) => `user:${userId}`,
//   userAuth: (email) => `auth:${email}`,
//   userGuild: (userId) => `user:${userId}:guild`,
  
//   guild: (guildId) => `guild:${guildId}`,
//   guildMembers: (guildId) => `guild:${guildId}:members`,
//   guildQuests: (guildId) => `guild:${guildId}:quests`,
//   guildWar: (guildId) => `guild:${guildId}:war`,
//   guildChat: (guildId) => `guild:${guildId}:chat`,
  
//   manga: (mangaId) => `manga:${mangaId}`,
//   chapter: (chapterId) => `chapter:${chapterId}`,
  
//   readingHistory: (userId) => `reading:${userId}:history`,
//   userReadChapter: (userId, chapterId) => `reading:${userId}:chapter:${chapterId}`,
  
//   leaderboard: {
//     users: 'leaderboard:users',
//     guilds: 'leaderboard:guilds',
//     guildWar: 'leaderboard:guild:war'
//   },
  
//   dailyStreak: (userId) => `streak:${userId}`,
//   achievements: (userId) => `achievements:${userId}`,
//   notifications: (userId) => `notifications:${userId}`,
// };

// // ===================================
// // 3. lib/utils.js - Utility Functions
// // ===================================

// export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// export const calculateXPForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));

// export const calculateLevelFromXP = (totalXP) => {
//   let level = 1;
//   let xpNeeded = 0;
//   while (xpNeeded <= totalXP) {
//     xpNeeded += calculateXPForLevel(level);
//     if (xpNeeded <= totalXP) level++;
//   }
//   return level;
// };

// export const calculateXPEarned = (activity, user, hasGuild = false) => {
//   const baseXP = {
//     chapterRead: 10,
//     mangaCompleted: 500,
//     dailyStreak: 50,
//     firstRead: 20,
//   };

//   const guildBonus = hasGuild ? 1.1 : 1.0;
//   const streakBonus = 1 + ((user.readingStreak || 0) * 0.05);
  
//   return Math.floor(baseXP[activity] * guildBonus * streakBonus);
// };

// export const calculateGuildPower = (members) => {
//   return members.reduce((total, member) => total + (member.level * 50), 0);
// };

// // ===================================
// // 4. lib/auth.js - Authentication Middleware
// // ===================================

// import jwt from 'jsonwebtoken';

// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// export const verifyToken = (token) => {
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } catch (error) {
//     return null;
//   }
// };

// export const generateToken = (userId) => {
//   return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
// };

// export const getUserFromRequest = (req) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return null;
//   }
  
//   const token = authHeader.substring(7);
//   return verifyToken(token);
// };

// // ===================================
// // 5. app/api/auth/register/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import bcrypt from 'bcrypt';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { generateToken, generateId } from '@/lib/utils';

// export async function POST(request) {
//   try {
//     const { email, username, password } = await request.json();

//     // Validate input
//     if (!email || !username || !password) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     // Check if user exists
//     const existingUser = await redis.get(KEYS.userAuth(email));
//     if (existingUser) {
//       return NextResponse.json(
//         { error: 'User already exists' },
//         { status: 409 }
//       );
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userId = generateId();

//     // Create user object
//     const user = {
//       id: userId,
//       email,
//       username,
//       level: 1,
//       currentXP: 0,
//       totalXP: 0,
//       xpToNextLevel: 100,
//       power: 50,
//       chaptersRead: 0,
//       mangasCompleted: 0,
//       readingStreak: 0,
//       lastActive: Date.now(),
//       guildId: null,
//       gold: 10000,
//       createdAt: Date.now(),
//     };

//     // Save to Redis
//     await redis.set(KEYS.user(userId), JSON.stringify(user));
//     await redis.set(KEYS.userAuth(email), JSON.stringify({ userId, password: hashedPassword }));
    
//     // Add to leaderboard
//     await redis.zadd(KEYS.leaderboard.users, 0, userId);

//     // Generate token
//     const token = generateToken(userId);

//     return NextResponse.json({
//       success: true,
//       token,
//       user: { ...user, password: undefined },
//     });
//   } catch (error) {
//     console.error('Registration error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 6. app/api/auth/login/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import bcrypt from 'bcrypt';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { generateToken } from '@/lib/utils';

// export async function POST(request) {
//   try {
//     const { email, password } = await request.json();

//     // Get user auth data
//     const authData = await redis.get(KEYS.userAuth(email));
//     if (!authData) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     const { userId, password: hashedPassword } = JSON.parse(authData);

//     // Verify password
//     const isValid = await bcrypt.compare(password, hashedPassword);
//     if (!isValid) {
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Get user data
//     const userData = await redis.get(KEYS.user(userId));
//     const user = JSON.parse(userData);

//     // Update last active
//     user.lastActive = Date.now();
//     await redis.set(KEYS.user(userId), JSON.stringify(user));

//     // Generate token
//     const token = generateToken(userId);

//     return NextResponse.json({
//       success: true,
//       token,
//       user,
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 7. app/api/user/stats/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';

// export async function GET(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const userData = await redis.get(KEYS.user(authUser.userId));
//     if (!userData) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     const user = JSON.parse(userData);
    
//     // Get guild info if user is in a guild
//     let guild = null;
//     if (user.guildId) {
//       const guildData = await redis.get(KEYS.guild(user.guildId));
//       guild = guildData ? JSON.parse(guildData) : null;
//     }

//     return NextResponse.json({
//       success: true,
//       user,
//       guild,
//     });
//   } catch (error) {
//     console.error('Get stats error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 8. app/api/reading/complete-chapter/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';
// import { calculateXPEarned, calculateLevelFromXP, calculateXPForLevel } from '@/lib/utils';

// export async function POST(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { chapterId, mangaId } = await request.json();

//     // Check if already read
//     const alreadyRead = await redis.get(KEYS.userReadChapter(authUser.userId, chapterId));
//     if (alreadyRead) {
//       return NextResponse.json(
//         { error: 'Chapter already read' },
//         { status: 400 }
//       );
//     }

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     // Calculate XP
//     const hasGuild = !!user.guildId;
//     const xpEarned = calculateXPEarned('chapterRead', user, hasGuild);

//     // Update user stats
//     user.chaptersRead += 1;
//     user.totalXP += xpEarned;
//     user.currentXP += xpEarned;
//     user.lastActive = Date.now();

//     // Check for level up
//     let leveledUp = false;
//     let newLevel = user.level;
//     while (user.currentXP >= user.xpToNextLevel) {
//       user.currentXP -= user.xpToNextLevel;
//       user.level += 1;
//       newLevel = user.level;
//       user.xpToNextLevel = calculateXPForLevel(user.level);
//       user.power = user.level * 50;
//       leveledUp = true;
//     }

//     // Update daily streak
//     const lastReadDate = user.lastReadDate || 0;
//     const today = new Date().setHours(0, 0, 0, 0);
//     const lastRead = new Date(lastReadDate).setHours(0, 0, 0, 0);
//     const daysSince = Math.floor((today - lastRead) / (1000 * 60 * 60 * 24));

//     if (daysSince === 1) {
//       user.readingStreak += 1;
//     } else if (daysSince > 1) {
//       user.readingStreak = 1;
//     }
//     user.lastReadDate = Date.now();

//     // Save user data
//     await redis.set(KEYS.user(authUser.userId), JSON.stringify(user));

//     // Mark chapter as read
//     await redis.set(
//       KEYS.userReadChapter(authUser.userId, chapterId),
//       JSON.stringify({ readAt: Date.now(), xpEarned })
//     );

//     // Add to reading history
//     await redis.lpush(
//       KEYS.readingHistory(authUser.userId),
//       JSON.stringify({
//         chapterId,
//         mangaId,
//         readAt: Date.now(),
//         xpEarned,
//       })
//     );
//     await redis.ltrim(KEYS.readingHistory(authUser.userId), 0, 99); // Keep last 100

//     // Update leaderboard
//     await redis.zadd(KEYS.leaderboard.users, user.totalXP, authUser.userId);

//     // Update guild progress if in guild
//     let guildUpdate = null;
//     if (user.guildId) {
//       guildUpdate = await updateGuildProgress(user.guildId, authUser.userId, xpEarned);
//     }

//     return NextResponse.json({
//       success: true,
//       xpEarned,
//       leveledUp,
//       newLevel,
//       user,
//       guildUpdate,
//     });
//   } catch (error) {
//     console.error('Complete chapter error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to update guild progress
// async function updateGuildProgress(guildId, userId, xpEarned) {
//   try {
//     // Get guild data
//     const guildData = await redis.get(KEYS.guild(guildId));
//     const guild = JSON.parse(guildData);

//     // Update guild stats
//     guild.weeklyXP = (guild.weeklyXP || 0) + xpEarned;
//     guild.totalChaptersRead = (guild.totalChaptersRead || 0) + 1;

//     // Save guild data
//     await redis.set(KEYS.guild(guildId), JSON.stringify(guild));

//     // Update guild quests
//     const questsData = await redis.get(KEYS.guildQuests(guildId));
//     if (questsData) {
//       const quests = JSON.parse(questsData);
//       quests.forEach(quest => {
//         if (quest.questType === 'chapters_read' && quest.currentProgress < quest.targetProgress) {
//           quest.currentProgress += 1;
//         }
//       });
//       await redis.set(KEYS.guildQuests(guildId), JSON.stringify(quests));
//     }

//     // Update guild war score
//     const warData = await redis.get(KEYS.guildWar(guildId));
//     const war = warData ? JSON.parse(warData) : { score: 0 };
//     war.score += 10; // 10 points per chapter
//     await redis.set(KEYS.guildWar(guildId), JSON.stringify(war));
//     await redis.zadd(KEYS.leaderboard.guildWar, war.score, guildId);

//     return { chaptersAdded: 1, xpAdded: xpEarned };
//   } catch (error) {
//     console.error('Update guild progress error:', error);
//     return null;
//   }
// }

// // ===================================
// // 9. app/api/guild/create/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';
// import { generateId } from '@/lib/utils';

// export async function POST(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { name, description, emblem, type = 'Casual' } = await request.json();

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     // Check if user already in a guild
//     if (user.guildId) {
//       return NextResponse.json(
//         { error: 'Already in a guild' },
//         { status: 400 }
//       );
//     }

//     // Check if user has enough gold
//     if (user.gold < 5000) {
//       return NextResponse.json(
//         { error: 'Insufficient gold' },
//         { status: 400 }
//       );
//     }

//     const guildId = generateId();

//     // Create guild
//     const guild = {
//       id: guildId,
//       name,
//       description: description || 'A new guild ready for adventure',
//       emblem: emblem || '👑',
//       level: 1,
//       members: 1,
//       maxMembers: 20,
//       power: user.power,
//       rank: 0,
//       type,
//       weeklyXP: 0,
//       totalChaptersRead: 0,
//       masterId: authUser.userId,
//       masterName: user.username,
//       requirements: 'Level 1+',
//       activities: ['Getting Started'],
//       perks: ['Guild Chat'],
//       createdAt: Date.now(),
//     };

//     // Save guild
//     await redis.set(KEYS.guild(guildId), JSON.stringify(guild));
//     await redis.sadd(KEYS.guildMembers(guildId), authUser.userId);
//     await redis.zadd(KEYS.leaderboard.guilds, 0, guildId);

//     // Create default quests
//     const defaultQuests = [
//       {
//         id: generateId(),
//         guildId,
//         title: 'Guild Reading Marathon',
//         description: 'Read 500 chapters as a guild',
//         questType: 'chapters_read',
//         currentProgress: 0,
//         targetProgress: 500,
//         reward: '3000 Guild XP',
//         difficulty: 'A',
//         startDate: Date.now(),
//         endDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
//         isCompleted: false,
//       },
//     ];
//     await redis.set(KEYS.guildQuests(guildId), JSON.stringify(defaultQuests));

//     // Initialize guild war
//     await redis.set(KEYS.guildWar(guildId), JSON.stringify({ score: 0 }));

//     // Update user
//     user.guildId = guildId;
//     user.gold -= 5000;
//     await redis.set(KEYS.user(authUser.userId), JSON.stringify(user));

//     return NextResponse.json({
//       success: true,
//       guild,
//       user,
//     });
//   } catch (error) {
//     console.error('Create guild error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 10. app/api/guild/join/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';
// import { calculateGuildPower } from '@/lib/utils';

// export async function POST(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { guildId } = await request.json();

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     // Check if already in guild
//     if (user.guildId) {
//       return NextResponse.json(
//         { error: 'Already in a guild' },
//         { status: 400 }
//       );
//     }

//     // Get guild data
//     const guildData = await redis.get(KEYS.guild(guildId));
//     if (!guildData) {
//       return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
//     }

//     const guild = JSON.parse(guildData);

//     // Check if guild is full
//     if (guild.members >= guild.maxMembers) {
//       return NextResponse.json(
//         { error: 'Guild is full' },
//         { status: 400 }
//       );
//     }

//     // Add user to guild
//     await redis.sadd(KEYS.guildMembers(guildId), authUser.userId);
//     guild.members += 1;
//     guild.power += user.power;

//     // Save guild
//     await redis.set(KEYS.guild(guildId), JSON.stringify(guild));

//     // Update user
//     user.guildId = guildId;
//     await redis.set(KEYS.user(authUser.userId), JSON.stringify(user));

//     return NextResponse.json({
//       success: true,
//       guild,
//       user,
//     });
//   } catch (error) {
//     console.error('Join guild error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 11. app/api/guild/leave/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';

// export async function POST(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     if (!user.guildId) {
//       return NextResponse.json(
//         { error: 'Not in a guild' },
//         { status: 400 }
//       );
//     }

//     const guildId = user.guildId;

//     // Get guild data
//     const guildData = await redis.get(KEYS.guild(guildId));
//     const guild = JSON.parse(guildData);

//     // Check if user is guild master
//     if (guild.masterId === authUser.userId) {
//       return NextResponse.json(
//         { error: 'Guild master cannot leave. Transfer leadership or disband guild.' },
//         { status: 400 }
//       );
//     }

//     // Remove user from guild
//     await redis.srem(KEYS.guildMembers(guildId), authUser.userId);
//     guild.members -= 1;
//     guild.power -= user.power;

//     // Save guild
//     await redis.set(KEYS.guild(guildId), JSON.stringify(guild));

//     // Update user
//     user.guildId = null;
//     await redis.set(KEYS.user(authUser.userId), JSON.stringify(user));

//     return NextResponse.json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error('Leave guild error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 12. app/api/guild/[guildId]/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';

// export async function GET(request, { params }) {
//   try {
//     const { guildId } = params;

//     // Get guild data
//     const guildData = await redis.get(KEYS.guild(guildId));
//     if (!guildData) {
//       return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
//     }

//     const guild = JSON.parse(guildData);

//     // Get members
//     const memberIds = await redis.smembers(KEYS.guildMembers(guildId));
//     const members = [];
//     for (const memberId of memberIds) {
//       const memberData = await redis.get(KEYS.user(memberId));
//       if (memberData) {
//         const member = JSON.parse(memberData);
//         members.push({
//           id: member.id,
//           username: member.username,
//           level: member.level,
//           power: member.power,
//           chaptersRead: member.chaptersRead,
//         });
//       }
//     }

//     // Get quests
//     const questsData = await redis.get(KEYS.guildQuests(guildId));
//     const quests = questsData ? JSON.parse(questsData) : [];

//     // Get war data
//     const warData = await redis.get(KEYS.guildWar(guildId));
//     const war = warData ? JSON.parse(warData) : { score: 0 };

//     return NextResponse.json({
//       success: true,
//       guild,
//       members,
//       quests,
//       war,
//     });
//   } catch (error) {
//     console.error('Get guild error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 13. app/api/guild/list/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const search = searchParams.get('search') || '';
//     const type = searchParams.get('type') || '';

//     // Get all guilds from leaderboard
//     const guildIds = await redis.zrevrange(KEYS.leaderboard.guilds, 0, -1);
//     const guilds = [];

//     for (const guildId of guildIds) {
//       const guildData = await redis.get(KEYS.guild(guildId));
//       if (guildData) {
//         const guild = JSON.parse(guildData);
        
//         // Apply filters
//         if (search && !guild.name.toLowerCase().includes(search.toLowerCase()) &&
//             !guild.description.toLowerCase().includes(search.toLowerCase())) {
//           continue;
//         }
        
//         if (type && guild.type !== type) {
//           continue;
//         }

//         guilds.push(guild);
//       }
//     }

//     // Sort by power
//     guilds.sort((a, b) => b.power - a.power);

//     // Assign ranks
//     guilds.forEach((guild, index) => {
//       guild.rank = index + 1;
//     });

//     return NextResponse.json({
//       success: true,
//       guilds,
//     });
//   } catch (error) {
//     console.error('List guilds error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 14. app/api/leaderboard/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const type = searchParams.get('type') || 'users'; // users, guilds, guildWar

//     let leaderboardKey;
//     if (type === 'users') {
//       leaderboardKey = KEYS.leaderboard.users;
//     } else if (type === 'guilds') {
//       leaderboardKey = KEYS.leaderboard.guilds;
//     } else if (type === 'guildWar') {
//       leaderboardKey = KEYS.leaderboard.guildWar;
//     } else {
//       return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
//     }

//     // Get top 100
//     const entries = await redis.zrevrange(leaderboardKey, 0, 99, 'WITHSCORES');
//     const leaderboard = [];

//     for (let i = 0; i < entries.length; i += 2) {
//       const id = entries[i];
//       const score = parseInt(entries[i + 1]);

//       if (type === 'users') {
//         const userData = await redis.get(KEYS.user(id));
//         if (userData) {
//           const user = JSON.parse(userData);
//           leaderboard.push({
//             rank: (i / 2) + 1,
//             id: user.id,
//             username: user.username,
//             level: user.level,
//             totalXP: user.totalXP,
//             chaptersRead: user.chaptersRead,
//           });
//         }
//       } else {
//         const guildData = await redis.get(KEYS.guild(id));
//         if (guildData) {
//           const guild = JSON.parse(guildData);
//           leaderboard.push({
//             rank: (i / 2) + 1,
//             ...guild,
//             score,
//           });
//         }
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       leaderboard,
//     });
//   } catch (error) {
//     console.error('Leaderboard error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 15. app/api/guild/chat/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';

// export async function POST(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { guildId, message } = await request.json();

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     // Verify user is in the guild
//     if (user.guildId !== guildId) {
//       return NextResponse.json(
//         { error: 'Not a member of this guild' },
//         { status: 403 }
//       );
//     }

//     const chatMessage = {
//       id: Date.now(),
//       userId: authUser.userId,
//       username: user.username,
//       message,
//       timestamp: Date.now(),
//     };

//     // Add to guild chat (keep last 100 messages)
//     await redis.lpush(KEYS.guildChat(guildId), JSON.stringify(chatMessage));
//     await redis.ltrim(KEYS.guildChat(guildId), 0, 99);

//     return NextResponse.json({
//       success: true,
//       message: chatMessage,
//     });
//   } catch (error) {
//     console.error('Send chat message error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// export async function GET(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const guildId = searchParams.get('guildId');

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     // Verify user is in the guild
//     if (user.guildId !== guildId) {
//       return NextResponse.json(
//         { error: 'Not a member of this guild' },
//         { status: 403 }
//       );
//     }

//     // Get chat messages
//     const messages = await redis.lrange(KEYS.guildChat(guildId), 0, 49);
//     const parsedMessages = messages.map(msg => JSON.parse(msg)).reverse();

//     return NextResponse.json({
//       success: true,
//       messages: parsedMessages,
//     });
//   } catch (error) {
//     console.error('Get chat messages error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 16. app/api/manga/[mangaId]/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { generateId } from '@/lib/utils';

// // Create/Update Manga
// export async function POST(request, { params }) {
//   try {
//     const { mangaId } = params;
//     const mangaData = await request.json();

//     const manga = {
//       id: mangaId,
//       ...mangaData,
//       updatedAt: Date.now(),
//     };

//     await redis.set(KEYS.manga(mangaId), JSON.stringify(manga));

//     return NextResponse.json({
//       success: true,
//       manga,
//     });
//   } catch (error) {
//     console.error('Create/Update manga error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // Get Manga
// export async function GET(request, { params }) {
//   try {
//     const { mangaId } = params;

//     const mangaData = await redis.get(KEYS.manga(mangaId));
//     if (!mangaData) {
//       return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
//     }

//     const manga = JSON.parse(mangaData);

//     return NextResponse.json({
//       success: true,
//       manga,
//     });
//   } catch (error) {
//     console.error('Get manga error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 17. app/api/user/reading-history/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';

// export async function GET(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const limit = parseInt(searchParams.get('limit') || '50');

//     // Get reading history
//     const history = await redis.lrange(
//       KEYS.readingHistory(authUser.userId),
//       0,
//       limit - 1
//     );
    
//     const parsedHistory = history.map(entry => JSON.parse(entry));

//     return NextResponse.json({
//       success: true,
//       history: parsedHistory,
//     });
//   } catch (error) {
//     console.error('Get reading history error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 18. app/api/achievements/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';

// const ACHIEVEMENTS = [
//   {
//     id: 'first_chapter',
//     title: 'First Steps',
//     description: 'Read your first chapter',
//     condition: (user) => user.chaptersRead >= 1,
//     reward: '100 Gold',
//   },
//   {
//     id: 'chapter_100',
//     title: 'Dedicated Reader',
//     description: 'Read 100 chapters',
//     condition: (user) => user.chaptersRead >= 100,
//     reward: '500 Gold',
//   },
//   {
//     id: 'chapter_500',
//     title: 'Manga Enthusiast',
//     description: 'Read 500 chapters',
//     condition: (user) => user.chaptersRead >= 500,
//     reward: '1000 Gold',
//   },
//   {
//     id: 'chapter_1000',
//     title: 'Legendary Reader',
//     description: 'Read 1000 chapters',
//     condition: (user) => user.chaptersRead >= 1000,
//     reward: '5000 Gold',
//   },
//   {
//     id: 'level_10',
//     title: 'Rising Hunter',
//     description: 'Reach level 10',
//     condition: (user) => user.level >= 10,
//     reward: '300 Gold',
//   },
//   {
//     id: 'level_25',
//     title: 'Elite Hunter',
//     description: 'Reach level 25',
//     condition: (user) => user.level >= 25,
//     reward: '800 Gold',
//   },
//   {
//     id: 'level_50',
//     title: 'Shadow Monarch',
//     description: 'Reach level 50',
//     condition: (user) => user.level >= 50,
//     reward: '2000 Gold',
//   },
//   {
//     id: 'streak_7',
//     title: 'Consistent Reader',
//     description: 'Maintain a 7-day reading streak',
//     condition: (user) => user.readingStreak >= 7,
//     reward: '200 Gold',
//   },
//   {
//     id: 'streak_30',
//     title: 'Devoted Fan',
//     description: 'Maintain a 30-day reading streak',
//     condition: (user) => user.readingStreak >= 30,
//     reward: '1500 Gold',
//   },
//   {
//     id: 'guild_master',
//     title: 'Guild Master',
//     description: 'Create a guild',
//     condition: (user) => user.guildId && user.isGuildMaster,
//     reward: 'Guild Master Badge',
//   },
// ];

// export async function GET(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     // Get unlocked achievements
//     const unlockedData = await redis.get(KEYS.achievements(authUser.userId));
//     const unlocked = unlockedData ? JSON.parse(unlockedData) : [];

//     // Check which achievements are unlocked
//     const achievements = ACHIEVEMENTS.map(achievement => ({
//       ...achievement,
//       unlocked: unlocked.includes(achievement.id) || achievement.condition(user),
//     }));

//     // Unlock new achievements
//     const newlyUnlocked = achievements
//       .filter(a => !unlocked.includes(a.id) && a.unlocked)
//       .map(a => a.id);

//     if (newlyUnlocked.length > 0) {
//       const updatedUnlocked = [...unlocked, ...newlyUnlocked];
//       await redis.set(
//         KEYS.achievements(authUser.userId),
//         JSON.stringify(updatedUnlocked)
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       achievements,
//       newlyUnlocked,
//     });
//   } catch (error) {
//     console.error('Get achievements error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 19. app/api/guild/quests/contribute/route.js
// // ===================================

// import { NextResponse } from 'next/server';
// import redis from '@/lib/redis';
// import { KEYS } from '@/lib/keys';
// import { getUserFromRequest } from '@/lib/auth';

// export async function POST(request) {
//   try {
//     const authUser = getUserFromRequest(request);
//     if (!authUser) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { questId, contribution } = await request.json();

//     // Get user data
//     const userData = await redis.get(KEYS.user(authUser.userId));
//     const user = JSON.parse(userData);

//     if (!user.guildId) {
//       return NextResponse.json(
//         { error: 'Not in a guild' },
//         { status: 400 }
//       );
//     }

//     // Get guild quests
//     const questsData = await redis.get(KEYS.guildQuests(user.guildId));
//     if (!questsData) {
//       return NextResponse.json({ error: 'No quests found' }, { status: 404 });
//     }

//     const quests = JSON.parse(questsData);
//     const quest = quests.find(q => q.id === questId);

//     if (!quest) {
//       return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
//     }

//     if (quest.isCompleted) {
//       return NextResponse.json(
//         { error: 'Quest already completed' },
//         { status: 400 }
//       );
//     }

//     // Update quest progress
//     quest.currentProgress = Math.min(
//       quest.currentProgress + contribution,
//       quest.targetProgress
//     );

//     // Check if quest is completed
//     if (quest.currentProgress >= quest.targetProgress) {
//       quest.isCompleted = true;
//       quest.completedAt = Date.now();

//       // Distribute rewards to all guild members
//       const memberIds = await redis.smembers(KEYS.guildMembers(user.guildId));
//       for (const memberId of memberIds) {
//         const memberData = await redis.get(KEYS.user(memberId));
//         if (memberData) {
//           const member = JSON.parse(memberData);
//           member.gold = (member.gold || 0) + 500; // Reward
//           await redis.set(KEYS.user(memberId), JSON.stringify(member));
//         }
//       }
//     }

//     // Save updated quests
//     await redis.set(KEYS.guildQuests(user.guildId), JSON.stringify(quests));

//     return NextResponse.json({
//       success: true,
//       quest,
//       contributed: contribution,
//     });
//   } catch (error) {
//     console.error('Contribute to quest error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // ===================================
// // 20. hooks/useAuth.js - Frontend Hook
// // ===================================

// /*
// 'use client';

// import { createContext, useContext, useState, useEffect } from 'react';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Load token from localStorage
//     const savedToken = localStorage.getItem('token');
//     if (savedToken) {
//       setToken(savedToken);
//       fetchUser(savedToken);
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   const fetchUser = async (authToken) => {
//     try {
//       const response = await fetch('/api/user/stats', {
//         headers: {
//           'Authorization': `Bearer ${authToken}`,
//         },
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         setUser(data.user);
//       } else {
//         logout();
//       }
//     } catch (error) {
//       console.error('Fetch user error:', error);
//       logout();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (email, password) => {
//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setToken(data.token);
//         setUser(data.user);
//         localStorage.setItem('token', data.token);
//         return { success: true };
//       } else {
//         const error = await response.json();
//         return { success: false, error: error.error };
//       }
//     } catch (error) {
//       return { success: false, error: 'Network error' };
//     }
//   };

//   const register = async (email, username, password) => {
//     try {
//       const response = await fetch('/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, username, password }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setToken(data.token);
//         setUser(data.user);
//         localStorage.setItem('token', data.token);
//         return { success: true };
//       } else {
//         const error = await response.json();
//         return { success: false, error: error.error };
//       }
//     } catch (error) {
//       return { success: false, error: 'Network error' };
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     setToken(null);
//     localStorage.removeItem('token');
//   };

//   const refreshUser = () => {
//     if (token) {
//       fetchUser(token);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{
//       user,
//       token,
//       loading,
//       login,
//       register,
//       logout,
//       refreshUser,
//       isAuthenticated: !!user,
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within AuthProvider');
//   }
//   return context;
// };
// */

// // ===================================
// // 21. hooks/useApi.js - API Helper Hook
// // ===================================

// /*
// 'use client';

// import { useAuth } from './useAuth';

// export function useApi() {
//   const { token } = useAuth();

//   const apiCall = async (endpoint, options = {}) => {
//     const headers = {
//       'Content-Type': 'application/json',
//       ...options.headers,
//     };

//     if (token) {
//       headers['Authorization'] = `Bearer ${token}`;
//     }

//     const response = await fetch(endpoint, {
//       ...options,
//       headers,
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.error || 'API call failed');
//     }

//     return response.json();
//   };

//   return {
//     // Reading
//     completeChapter: async (chapterId, mangaId) => {
//       return apiCall('/api/reading/complete-chapter', {
//         method: 'POST',
//         body: JSON.stringify({ chapterId, mangaId }),
//       });
//     },

//     // Guild
//     createGuild: async (guildData) => {
//       return apiCall('/api/guild/create', {
//         method: 'POST',
//         body: JSON.stringify(guildData),
//       });
//     },

//     joinGuild: async (guildId) => {
//       return apiCall('/api/guild/join', {
//         method: 'POST',
//         body: JSON.stringify({ guildId }),
//       });
//     },

//     leaveGuild: async () => {
//       return apiCall('/api/guild/leave', {
//         method: 'POST',
//       });
//     },

//     getGuild: async (guildId) => {
//       return apiCall(`/api/guild/${guildId}`);
//     },

//     listGuilds: async (filters = {}) => {
//       const params = new URLSearchParams(filters);
//       return apiCall(`/api/guild/list?${params}`);
//     },

//     sendChatMessage: async (guildId, message) => {
//       return apiCall('/api/guild/chat', {
//         method: 'POST',
//         body: JSON.stringify({ guildId, message }),
//       });
//     },

//     getChatMessages: async (guildId) => {
//       return apiCall(`/api/guild/chat?guildId=${guildId}`);
//     },

//     contributeToQuest: async (questId, contribution) => {
//       return apiCall('/api/guild/quests/contribute', {
//         method: 'POST',
//         body: JSON.stringify({ questId, contribution }),
//       });
//     },

//     // User
//     getUserStats: async () => {
//       return apiCall('/api/user/stats');
//     },

//     getReadingHistory: async (limit = 50) => {
//       return apiCall(`/api/user/reading-history?limit=${limit}`);
//     },

//     getAchievements: async () => {
//       return apiCall('/api/achievements');
//     },

//     // Leaderboard
//     getLeaderboard: async (type = 'users') => {
//       return apiCall(`/api/leaderboard?type=${type}`);
//     },
//   };
// }
// */

// // ===================================
// // 22. .env.local - Environment Variables
// // ===================================

// /*
// REDIS_HOST=localhost
// REDIS_PORT=6379
// REDIS_PASSWORD=your-redis-password
// JWT_SECRET=your-super-secret-jwt-key-change-in-production
// NEXT_PUBLIC_API_URL=http://localhost:3000
// */

// // ===================================
// // 23. Example Usage in Component
// // ===================================

// /*
// 'use client';

// import { useAuth } from '@/hooks/useAuth';
// import { useApi } from '@/hooks/useApi';
// import { useState } from 'react';

// export default function MangaReader({ chapterId, mangaId }) {
//   const { user, refreshUser } = useAuth();
//   const api = useApi();
//   const [notification, setNotification] = useState(null);

//   const handleChapterComplete = async () => {
//     try {
//       const result = await api.completeChapter(chapterId, mangaId);
      
//       setNotification({
//         type: 'success',
//         message: `+${result.xpEarned} XP earned!${result.leveledUp ? ` Level up to ${result.newLevel}!` : ''}`,
//       });

//       // Refresh user data
//       await refreshUser();

//       // Show level up animation if applicable
//       if (result.leveledUp) {
//         // Trigger level up animation
//       }

//     } catch (error) {
//       setNotification({
//         type: 'error',
//         message: error.message,
//       });
//     }
//   };

//   return (
//     <div>
//       {notification && (
//         <div className={`notification ${notification.type}`}>
//           {notification.message}
//         </div>
//       )}
      
//       <button onClick={handleChapterComplete}>
//         Mark Chapter as Read
//       </button>
//     </div>
//   );
// }
// */