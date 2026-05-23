export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: Parameter[];
  requestBody?: any;
  response?: any;
  example?: string;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  location?: "path" | "query" | "header";
}

export interface ApiDocumentation {
  title: string;
  version: string;
  baseUrl: string;
  description: string;
  endpoints: EndpointGroup[];
}

export interface EndpointGroup {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
}

export const apiDocumentation: ApiDocumentation = {
  title: "CommunityOS API Documentation",
  version: "1.0.0",
  baseUrl: "http://localhost:10100",
  description: "CommunityOS provides APIs for community building, member management, discussions, events, and gamification.",
  endpoints: [
    {
      name: "Health & Info",
      description: "Health check and API information endpoints",
      endpoints: [
        {
          method: "GET",
          path: "/health",
          description: "Check API health status",
          response: {
            status: "ok",
            service: "CommunityOS",
            timestamp: "2026-05-23T00:00:00.000Z"
          },
          example: `curl -X GET http://localhost:10100/health`
        },
        {
          method: "GET",
          path: "/docs",
          description: "Get API documentation",
          response: {
            message: "See /docs endpoint for API documentation"
          },
          example: `curl -X GET http://localhost:10100/docs`
        },
        {
          method: "GET",
          path: "/overview",
          description: "Get community overview and statistics",
          response: {
            communities: 2,
            members: { total: 5, active: 5, newThisMonth: 5 },
            groups: { total: 3, active: 3 },
            posts: { total: 3, thisWeek: 3 },
            discussions: { total: 2, open: 1, solved: 1 },
            events: { upcoming: 3, completed: 0 },
            resources: { total: 3, downloads: 301 },
            badges: { total: 4, awarded: 5 },
            engagement: { score: 74, trend: "stable" },
            healthScore: 80
          },
          example: `curl -X GET http://localhost:10100/overview`
        }
      ]
    },
    {
      name: "Communities",
      description: "Manage communities - the top-level organizational units for members, groups, and content",
      endpoints: [
        {
          method: "GET",
          path: "/communities",
          description: "List all communities",
          parameters: [
            { name: "search", type: "string", required: false, description: "Search by name or description", location: "query" },
            { name: "type", type: "string", required: false, description: "Filter by type (developer, training, career, etc.)", location: "query" },
            { name: "status", type: "string", required: false, description: "Filter by status (active, inactive, archived)", location: "query" }
          ],
          response: [{
            id: "comm_demo_1",
            key: "appneural-developers",
            name: "APPNEURAL Developer Community",
            type: "developer",
            status: "active",
            memberCount: 3
          }],
          example: `curl -X GET "http://localhost:10100/communities?type=developer"`
        },
        {
          method: "POST",
          path: "/communities",
          description: "Create a new community",
          requestBody: {
            key: "my-community",
            name: "My Community",
            description: "Description of my community",
            type: "developer",
            ownerId: "user_123",
            visibility: "public",
            category: "Technology"
          },
          response: {
            id: "comm_new",
            key: "my-community",
            name: "My Community",
            status: "active",
            memberCount: 0
          },
          example: `curl -X POST http://localhost:10100/communities \\
  -H "Content-Type: application/json" \\
  -d '{"key":"my-community","name":"My Community","type":"developer","ownerId":"user_123"}'`
        },
        {
          method: "GET",
          path: "/communities/:id",
          description: "Get a specific community by ID",
          parameters: [
            { name: "id", type: "string", required: true, description: "Community ID", location: "path" }
          ],
          response: {
            id: "comm_demo_1",
            key: "appneural-developers",
            name: "APPNEURAL Developer Community",
            description: "Help developers learn AI, systems, automation, cloud, and product engineering",
            type: "developer",
            status: "active",
            memberCount: 3
          },
          example: `curl -X GET http://localhost:10100/communities/comm_demo_1`
        }
      ]
    },
    {
      name: "Members",
      description: "Manage community members - users who belong to communities with roles and engagement scores",
      endpoints: [
        {
          method: "GET",
          path: "/members",
          description: "List all members",
          parameters: [
            { name: "communityId", type: "string", required: false, description: "Filter by community ID", location: "query" },
            { name: "status", type: "string", required: false, description: "Filter by status (active, inactive, banned, etc.)", location: "query" },
            { name: "role", type: "string", required: false, description: "Filter by role (owner, admin, moderator, member, etc.)", location: "query" }
          ],
          response: [{
            id: "mem_demo_1",
            communityId: "comm_demo_1",
            displayName: "Ajay Prajapat",
            role: "owner",
            status: "active",
            engagementScore: 95,
            points: 1250,
            level: 5
          }],
          example: `curl -X GET "http://localhost:10100/members?communityId=comm_demo_1"`
        },
        {
          method: "POST",
          path: "/members",
          description: "Add a new member to a community",
          requestBody: {
            communityId: "comm_demo_1",
            userId: "user_456",
            displayName: "Jane Doe",
            email: "jane@example.com",
            role: "member"
          },
          response: {
            id: "mem_new",
            communityId: "comm_demo_1",
            displayName: "Jane Doe",
            status: "active",
            role: "member",
            points: 0,
            level: 1
          },
          example: `curl -X POST http://localhost:10100/members \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":"comm_demo_1","userId":"user_456","displayName":"Jane Doe"}'`
        },
        {
          method: "GET",
          path: "/members/:id",
          description: "Get a specific member by ID",
          parameters: [
            { name: "id", type: "string", required: true, description: "Member ID", location: "path" }
          ],
          response: {
            id: "mem_demo_1",
            communityId: "comm_demo_1",
            displayName: "Ajay Prajapat",
            email: "ajay@appneural.com",
            role: "owner",
            status: "active",
            engagementScore: 95,
            points: 1250,
            level: 5,
            badges: ["badge_first_post", "badge_contributor"]
          },
          example: `curl -X GET http://localhost:10100/members/mem_demo_1`
        }
      ]
    },
    {
      name: "Groups",
      description: "Manage groups/circles within communities - smaller spaces for focused discussions and collaboration",
      endpoints: [
        {
          method: "GET",
          path: "/groups",
          description: "List all groups",
          parameters: [
            { name: "communityId", type: "string", required: false, description: "Filter by community ID", location: "query" }
          ],
          response: [{
            id: "grp_demo_1",
            communityId: "comm_demo_1",
            name: "React Learning Circle",
            type: "interest",
            status: "active",
            memberCount: 2
          }],
          example: `curl -X GET "http://localhost:10100/groups?communityId=comm_demo_1"`
        },
        {
          method: "POST",
          path: "/groups",
          description: "Create a new group",
          requestBody: {
            communityId: "comm_demo_1",
            name: "AI Agents Study Group",
            description: "Study group for AI agents and automation",
            type: "interest",
            ownerId: "user_ajay"
          },
          response: {
            id: "grp_new",
            communityId: "comm_demo_1",
            name: "AI Agents Study Group",
            type: "interest",
            status: "active",
            memberCount: 0
          },
          example: `curl -X POST http://localhost:10100/groups \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":"comm_demo_1","name":"AI Agents Study Group","type":"interest","ownerId":"user_ajay"}'`
        }
      ]
    },
    {
      name: "Posts",
      description: "Manage community feed posts - content shared by members including text, questions, announcements, and achievements",
      endpoints: [
        {
          method: "GET",
          path: "/posts",
          description: "List all posts",
          parameters: [
            { name: "communityId", type: "string", required: false, description: "Filter by community ID", location: "query" },
            { name: "type", type: "string", required: false, description: "Filter by type (text, question, announcement, achievement, etc.)", location: "query" },
            { name: "search", type: "string", required: false, description: "Search in title and content", location: "query" }
          ],
          response: [{
            id: "post_demo_1",
            communityId: "comm_demo_1",
            authorId: "user_ajay",
            type: "text",
            title: "Welcome to APPNEURAL Developer Community!",
            likes: 12,
            comments: 5,
            views: 145,
            isPinned: true
          }],
          example: `curl -X GET "http://localhost:10100/posts?communityId=comm_demo_1"`
        },
        {
          method: "POST",
          path: "/posts",
          description: "Create a new post",
          requestBody: {
            communityId: "comm_demo_1",
            authorId: "user_sarah",
            type: "question",
            title: "How to optimize React performance?",
            content: "Looking for tips on improving React app performance...",
            tags: ["react", "performance", "optimization"]
          },
          response: {
            id: "post_new",
            communityId: "comm_demo_1",
            authorId: "user_sarah",
            type: "question",
            title: "How to optimize React performance?",
            likes: 0,
            comments: 0,
            views: 0
          },
          example: `curl -X POST http://localhost:10100/posts \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":"comm_demo_1","authorId":"user_sarah","type":"question","title":"How to optimize React performance?","content":"Looking for tips..."}'`
        }
      ]
    },
    {
      name: "Discussions",
      description: "Manage discussion forums - structured conversations organized by categories with replies and solutions",
      endpoints: [
        {
          method: "GET",
          path: "/discussions",
          description: "List all discussions",
          parameters: [
            { name: "communityId", type: "string", required: false, description: "Filter by community ID", location: "query" },
            { name: "category", type: "string", required: false, description: "Filter by category (questions, announcements, learning, projects, etc.)", location: "query" }
          ],
          response: [{
            id: "disc_demo_1",
            communityId: "comm_demo_1",
            authorId: "user_mike",
            title: "How to structure a Node.js backend for scalability?",
            category: "questions",
            replies: 7,
            views: 312,
            isSolved: true
          }],
          example: `curl -X GET "http://localhost:10100/discussions?communityId=comm_demo_1"`
        },
        {
          method: "POST",
          path: "/discussions",
          description: "Create a new discussion",
          requestBody: {
            communityId: "comm_demo_1",
            authorId: "user_ajay",
            title: "Best practices for TypeScript",
            content: "Let's discuss TypeScript best practices and patterns...",
            category: "learning",
            tags: ["typescript", "best-practices"]
          },
          response: {
            id: "disc_new",
            communityId: "comm_demo_1",
            authorId: "user_ajay",
            title: "Best practices for TypeScript",
            category: "learning",
            replies: 0,
            views: 0,
            isSolved: false
          },
          example: `curl -X POST http://localhost:10100/discussions \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":"comm_demo_1","authorId":"user_ajay","title":"Best practices for TypeScript","category":"learning"}'`
        }
      ]
    },
    {
      name: "Events",
      description: "Manage community events - workshops, webinars, meetups, and other gatherings with registration",
      endpoints: [
        {
          method: "GET",
          path: "/events",
          description: "List all events",
          parameters: [
            { name: "communityId", type: "string", required: false, description: "Filter by community ID", location: "query" },
            { name: "upcoming", type: "boolean", required: false, description: "Show only upcoming events", location: "query" }
          ],
          response: [{
            id: "evt_demo_1",
            communityId: "comm_demo_1",
            title: "AI Agents Workshop",
            type: "workshop",
            status: "active",
            startDate: "2026-06-06T00:00:00.000Z",
            registeredCount: 32,
            maxAttendees: 50
          }],
          example: `curl -X GET "http://localhost:10100/events?communityId=comm_demo_1&upcoming=true"`
        },
        {
          method: "POST",
          path: "/events",
          description: "Create a new event",
          requestBody: {
            communityId: "comm_demo_1",
            organizerId: "user_ajay",
            title: "Node.js Deep Dive Workshop",
            description: "Learn advanced Node.js concepts and patterns",
            type: "workshop",
            startDate: "2026-06-20T10:00:00.000Z",
            endDate: "2026-06-20T14:00:00.000Z",
            timezone: "UTC",
            isOnline: true,
            maxAttendees: 30,
            registrationRequired: true
          },
          response: {
            id: "evt_new",
            communityId: "comm_demo_1",
            title: "Node.js Deep Dive Workshop",
            type: "workshop",
            status: "active",
            registeredCount: 0
          },
          example: `curl -X POST http://localhost:10100/events \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":"comm_demo_1","organizerId":"user_ajay","title":"Node.js Deep Dive","type":"workshop","startDate":"2026-06-20T10:00:00.000Z"}'`
        },
        {
          method: "POST",
          path: "/events/:id/register",
          description: "Register a member for an event",
          requestBody: {
            memberId: "mem_demo_2"
          },
          response: {
            id: "reg_new",
            eventId: "evt_demo_1",
            memberId: "mem_demo_2",
            status: "registered",
            registeredAt: "2026-05-23T00:00:00.000Z"
          },
          example: `curl -X POST http://localhost:10100/events/evt_demo_1/register \\
  -H "Content-Type: application/json" \\
  -d '{"memberId":"mem_demo_2"}'`
        }
      ]
    },
    {
      name: "Badges & Gamification",
      description: "Manage badges and gamification - award achievements, track points, and levels",
      endpoints: [
        {
          method: "POST",
          path: "/badges",
          description: "Create a new badge",
          requestBody: {
            communityId: "comm_demo_1",
            key: "ai_expert",
            name: "AI Expert",
            description: "Awarded for expertise in AI and machine learning",
            type: "achievement",
            points: 500,
            criteria: "Complete 3 AI-related courses"
          },
          response: {
            id: "badge_new",
            communityId: "comm_demo_1",
            key: "ai_expert",
            name: "AI Expert",
            type: "achievement",
            points: 500,
            awardedCount: 0
          },
          example: `curl -X POST http://localhost:10100/badges \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":"comm_demo_1","key":"ai_expert","name":"AI Expert","points":500}'`
        },
        {
          method: "POST",
          path: "/badges/:id/award",
          description: "Award a badge to a member",
          requestBody: {
            memberId: "mem_demo_3"
          },
          response: {
            id: "mbadge_new",
            badgeId: "badge_first_post",
            memberId: "mem_demo_3",
            awardedAt: "2026-05-23T00:00:00.000Z"
          },
          example: `curl -X POST http://localhost:10100/badges/badge_first_post/award \\
  -H "Content-Type: application/json" \\
  -d '{"memberId":"mem_demo_3"}'`
        }
      ]
    },
    {
      name: "Resources",
      description: "Manage community resources - documents, guides, templates, and other materials shared with members",
      endpoints: [
        {
          method: "GET",
          path: "/resources",
          description: "List all resources",
          parameters: [
            { name: "communityId", type: "string", required: false, description: "Filter by community ID", location: "query" },
            { name: "type", type: "string", required: false, description: "Filter by type (pdf, guide, template, etc.)", location: "query" }
          ],
          response: [{
            id: "res_demo_1",
            communityId: "comm_demo_1",
            title: "Node.js Best Practices Guide",
            type: "guide",
            downloads: 145,
            accessLevel: "member"
          }],
          example: `curl -X GET "http://localhost:10100/resources?communityId=comm_demo_1"`
        },
        {
          method: "POST",
          path: "/resources",
          description: "Upload a new resource",
          requestBody: {
            communityId: "comm_demo_1",
            uploadedBy: "user_ajay",
            title: "React Performance Optimization Guide",
            description: "Comprehensive guide to optimizing React applications",
            type: "guide",
            url: "https://resources.example.com/react-optimization",
            accessLevel: "member",
            tags: ["react", "performance", "frontend"]
          },
          response: {
            id: "res_new",
            communityId: "comm_demo_1",
            title: "React Performance Optimization Guide",
            type: "guide",
            downloads: 0,
            status: "active"
          },
          example: `curl -X POST http://localhost:10100/resources \\
  -H "Content-Type: application/json" \\
  -d '{"communityId":"comm_demo_1","uploadedBy":"user_ajay","title":"React Guide","type":"guide","url":"https://example.com/react-guide"}'`
        }
      ]
    }
  ]
};

export function getApiDocs(): ApiDocumentation {
  return apiDocumentation;
}

export function formatExample(endpoint: ApiEndpoint): string {
  return endpoint.example || `curl -X ${endpoint.method} ${endpoint.path}`;
}

export function getEndpointSummary(): Array<{ method: string; path: string; description: string }> {
  const summary: Array<{ method: string; path: string; description: string }> = [];
  for (const group of apiDocumentation.endpoints) {
    for (const endpoint of group.endpoints) {
      summary.push({
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description
      });
    }
  }
  return summary;
}
