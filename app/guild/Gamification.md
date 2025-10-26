# Integration Guide: Connecting Guild System with Real Manga Data

## 🎯 Core Concept

Your manga reading app tracks user activity → Converts reading into XP/Progress → Updates both individual leveling system AND guild progress simultaneously.

---

## 📊 Data Flow

```
User Reads Chapter → Event Triggered → Update 3 Systems:
  1. User Leveling (individual XP, level up)
  2. Guild Quests (contribute to guild goals)
  3. Guild Wars (add to guild's total score)
```

---

## 🔗 Connection Points

### 1. **When User Reads a Chapter**

```javascript
// Trigger this function every time a chapter is marked as read
async function onChapterRead(userId, chapterId, mangaId) {
  const xpEarned = 10; // Base XP per chapter

  // Update user stats
  await updateUserStats(userId, {
    chaptersRead: +1,
    xp: +xpEarned,
    lastActive: Date.now(),
  });

  // Update guild progress (if user is in a guild)
  const userGuild = await getUserGuild(userId);
  if (userGuild) {
    await updateGuildQuests(userGuild.id, "chaptersRead", 1);
    await updateGuildWar(userGuild.id, xpEarned);
  }

  // Check for level up
  await checkLevelUp(userId);
}
```

### 2. **User Leveling System Integration**

Track these metrics from actual reading:

- **Chapters read** → XP earned
- **Mangas completed** → Bonus XP
- **Reading streak** → Multiplier bonus
- **Time spent reading** → Activity score

### 3. **Guild Quest Integration**

Map your quests to real activities:

```javascript
const questTypes = {
  chapters_read: {
    title: "Guild Reading Marathon",
    trackField: "chaptersRead",
    target: 1000,
  },
  mangas_completed: {
    title: "Complete 50 Series",
    trackField: "mangasCompleted",
    target: 50,
  },
  daily_active: {
    title: "Daily Active Members",
    trackField: "activeMembersToday",
    target: 20,
  },
};
```

### 4. **Guild Wars Integration**

Calculate guild score from real activity:

```javascript
const guildScore =
  totalChaptersRead * 10 + // 10 points per chapter
  mangasCompleted * 100 + // 100 points per completed manga
  activeMembersCount * 50; // 50 points per active member
```

---

## 🗄️ Database Schema Suggestions

### Users Table

```sql
users {
  id: string
  username: string
  email: string
  level: number
  currentXP: number
  totalXP: number
  chaptersRead: number
  mangasCompleted: number
  readingStreak: number
  lastActive: timestamp
  guildId: string (foreign key)
  createdAt: timestamp
}
```

### Guilds Table

```sql
guilds {
  id: string
  name: string
  emblem: string
  level: number
  totalMembers: number
  maxMembers: number
  totalPower: number (sum of all members)
  weeklyXP: number
  totalChaptersRead: number
  rank: number
  createdAt: timestamp
  masterId: string (foreign key to users)
}
```

### Guild Quests Table

```sql
guild_quests {
  id: string
  guildId: string
  title: string
  description: string
  questType: string ('chapters_read', 'mangas_completed', etc)
  currentProgress: number
  targetProgress: number
  reward: string
  startDate: timestamp
  endDate: timestamp
  isCompleted: boolean
}
```

### Reading History Table

```sql
reading_history {
  id: string
  userId: string
  mangaId: string
  chapterId: string
  readAt: timestamp
  xpEarned: number
  contributedToGuild: boolean
}
```

### Guild Activity Log

```sql
guild_activities {
  id: string
  guildId: string
  userId: string
  activityType: string ('chapter_read', 'quest_completed', 'member_joined')
  points: number
  timestamp: timestamp
}
```

---

## 🔄 Real-Time Updates

### Option 1: **Backend API Approach**

```javascript
// API Endpoints you'll need:

POST /api/reading/complete-chapter
  - Records chapter read
  - Updates user XP
  - Updates guild progress
  - Returns: updated user stats + guild progress

GET /api/user/stats/:userId
  - Returns user leveling info

GET /api/guild/:guildId/progress
  - Returns guild quests, wars, stats

POST /api/guild/contribute
  - Manual contribution (like donations)

GET /api/leaderboard/guilds
  - Returns sorted guilds by score
```

### Option 2: **Storage-Based (Current Approach)**

```javascript
// When chapter is read:
async function recordChapterRead(userId, chapterId) {
  // 1. Get user data
  const userData = await storage.get(`user:${userId}`);
  const user = JSON.parse(userData.value);

  // 2. Update user stats
  user.chaptersRead += 1;
  user.currentXP += 10;
  user.totalXP += 10;

  // 3. Check level up
  if (user.currentXP >= user.xpToNextLevel) {
    user.level += 1;
    user.currentXP = 0;
    user.xpToNextLevel = calculateXPForNextLevel(user.level);
  }

  // 4. Save user data
  await storage.set(`user:${userId}`, JSON.stringify(user));

  // 5. Update guild if in one
  if (user.guildId) {
    await updateGuildProgress(user.guildId, 1);
  }
}

async function updateGuildProgress(guildId, chapters) {
  // Get guild quests
  const questsData = await storage.get(`guild-quests:${guildId}`);
  const quests = JSON.parse(questsData.value);

  // Update relevant quests
  quests.forEach((quest) => {
    if (quest.type === "chapters_read") {
      quest.progress += chapters;
    }
  });

  // Save updated quests
  await storage.set(`guild-quests:${guildId}`, JSON.stringify(quests));

  // Update guild war score
  const guildData = await storage.get(`guild:${guildId}`);
  const guild = JSON.parse(guildData.value);
  guild.warScore += chapters * 10;
  await storage.set(`guild:${guildId}`, JSON.stringify(guild));
}
```

---

## 📱 Frontend Integration

### On Your Manga Reader Page

```javascript
// When user finishes reading a chapter:
const handleChapterComplete = async (chapterId) => {
  // 1. Mark chapter as read in your reading system
  await markChapterAsRead(chapterId);

  // 2. Record the activity for leveling
  const xpGained = await recordReadingActivity({
    chapterId,
    mangaId: currentManga.id,
    timestamp: Date.now(),
  });

  // 3. Show XP gained notification
  showNotification(`+${xpGained} XP earned!`);

  // 4. Update UI with new stats
  await refreshUserStats();

  // 5. If in guild, update guild progress
  if (userGuild) {
    await updateGuildContribution();
  }
};
```

### On Your Leveling/Awards Page

```javascript
// Fetch and display real user stats
useEffect(() => {
  const loadUserStats = async () => {
    const stats = await storage.get(`user:${currentUserId}`);
    const userData = JSON.parse(stats.value);

    setUserLevel(userData.level);
    setCurrentXP(userData.currentXP);
    setTotalChaptersRead(userData.chaptersRead);
    setMangasCompleted(userData.mangasCompleted);
    // ... etc
  };

  loadUserStats();
}, [currentUserId]);
```

### On Your Guild Page

```javascript
// Fetch real guild data
useEffect(() => {
  const loadGuildData = async () => {
    const guildData = await storage.get(`guild:${userGuildId}`);
    const guild = JSON.parse(guildData.value);

    const questsData = await storage.get(`guild-quests:${userGuildId}`);
    const quests = JSON.parse(questsData.value);

    setGuildInfo(guild);
    setGuildQuests(quests);
  };

  loadGuildData();
}, [userGuildId]);
```

---

## 🎮 Gamification Formulas

### XP Calculation

```javascript
const calculateXP = (activity) => {
  const baseXP = {
    chapterRead: 10,
    mangaCompleted: 500,
    dailyStreak: 50,
    firstRead: 20,
  };

  const multipliers = {
    guildBonus: userGuild ? 1.1 : 1.0, // 10% bonus if in guild
    streakBonus: 1 + readingStreak * 0.05, // 5% per day streak
    premiumBonus: isPremium ? 1.5 : 1.0,
  };

  return (
    baseXP[activity] *
    multipliers.guildBonus *
    multipliers.streakBonus *
    multipliers.premiumBonus
  );
};
```

### Level Up Requirements

```javascript
const getXPForLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Level 1→2: 100 XP
// Level 2→3: 150 XP
// Level 3→4: 225 XP
// etc.
```

### Guild Power Calculation

```javascript
const calculateGuildPower = (guild) => {
  const memberPower = guild.members.reduce(
    (sum, member) => sum + member.level * 50,
    0
  );

  const activityBonus = guild.weeklyChaptersRead * 2;
  const levelBonus = guild.level * 1000;

  return memberPower + activityBonus + levelBonus;
};
```

---

## 🚀 Implementation Steps

### Phase 1: Connect User Reading to Stats

1. Add tracking to your manga reader component
2. Create user stats storage structure
3. Update stats on every chapter read
4. Display stats on profile/leveling page

### Phase 2: Implement Leveling System

1. Calculate XP per chapter
2. Track total XP and current level
3. Add level up logic and animations
4. Create rewards for milestones

### Phase 3: Connect to Guild System

1. Link user profile to guild
2. Aggregate member activity for guild quests
3. Update guild war scores in real-time
4. Display guild progress on guild page

### Phase 4: Add Real-Time Features

1. Live leaderboard updates
2. Notifications for guild achievements
3. Member activity feed
4. Quest completion celebrations

---

## 🔒 Important Considerations

### Data Consistency

- Use transactions when updating multiple related records
- Validate data before updating
- Handle race conditions (multiple users updating same guild)

### Performance

- Cache frequently accessed data (user stats, guild info)
- Batch updates when possible
- Use pagination for large lists (guild members, reading history)

### Security

- Validate user ownership before allowing updates
- Prevent cheating (chapter completion validation)
- Rate limit contribution endpoints

---

## 📝 Example: Complete Flow

**User "ShadowReader" reads Chapter 145 of "Solo Leveling":**

1. ✅ Manga reader marks chapter as read
2. ✅ System records: `reading_history` entry created
3. ✅ User stats updated:
   - `chaptersRead: 1251` (+1)
   - `currentXP: 4510` (+10)
   - `lastActive: now`
4. ✅ Guild "Shadow Monarchs" updated:
   - Quest "Read 1000 Chapters": `756 → 757`
   - War score: `58400 → 58410`
   - Weekly XP: `125000 → 125010`
5. ✅ Check achievements:
   - "1000 Chapters" milestone? → Not yet
   - Daily streak maintained? → Yes, +50 bonus XP
6. ✅ UI updates:
   - Show "+10 XP" animation
   - Update progress bars
   - Show guild contribution badge
7. ✅ Guild members notified:
   - "ShadowReader contributed to Guild Quest!"

---

## 🎁 Bonus: Event System Integration

Create special events that boost rewards:

```javascript
const events = {
  doubleXPWeekend: {
    active: true,
    multiplier: 2.0,
    endDate: "2025-11-01",
  },
  guildWarSeason: {
    active: true,
    bonus: "Extra rewards for top 10 guilds",
  },
};
```

This way, reading manga becomes a social, competitive, and rewarding experience! 🚀
