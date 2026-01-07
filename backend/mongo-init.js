// MongoDB initialization script
db = db.getSiblingDB('nexa');

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('projects');
db.createCollection('agents');
db.createCollection('analytics');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.projects.createIndex({ user: 1, status: 1 });
db.projects.createIndex({ createdAt: -1 });
db.projects.createIndex({ 'analytics.confidenceScore': -1 });

db.agents.createIndex({ name: 1 }, { unique: true });
db.agents.createIndex({ type: 1 });

db.analytics.createIndex({ user: 1, timestamp: -1 });
db.analytics.createIndex({ project: 1, agent: 1 });
db.analytics.createIndex({ action: 1, timestamp: 1 });

// Create initial admin user if not exists
const adminExists = db.users.findOne({ email: 'admin@nexa.ai' });
if (!adminExists) {
  db.users.insertOne({
    email: 'admin@nexa.ai',
    name: 'Nexa Admin',
    password: '$2a$10$YourHashedPasswordHere', // Replace with actual hashed password
    role: 'admin',
    settings: {
      emailNotifications: true,
      defaultModel: 'gemini-3-pro'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Admin user created');
}

print('MongoDB initialization completed');