# 🎓 Exam Scheduler

A comprehensive web application for generating optimized exam timetables for educational institutions. This platform automates the complex process of scheduling multiple courses across different time slots while respecting venue capacity constraints and academic requirements.

## 🌟 Features

### 📊 **Course Management**
- Upload course data via CSV files
- View and manage course information (code, title, student count, department)
- Support for courses of varying sizes (small to large)

### 🗓️ **Intelligent Timetable Generation**
- **Pure backend algorithm** - No AI dependencies, fast and reliable
- **Randomized generation** - Different arrangements each time for flexibility
- **Multi-week support** - Generate schedules for 1-10 weeks
- **Real-time validation** - Ensures all courses are scheduled without conflicts

### 🏢 **Venue Management**
- **Dual-venue system** - RED and BLUE rooms with different capacities
- **Smart capacity management** - Automatic course-to-venue matching
- **Supervisor assignment** - Track and manage exam supervisors

## 🏗️ **Architecture**

### **Frontend**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for modern, responsive UI
- **React Context** for state management

### **Backend**
- **Next.js API Routes** for server-side logic
- **Prisma ORM** with SQLite database
- **Pure algorithmic approach** for timetable generation
- **Real-time validation** and error handling

### **Database Schema**
- **Courses**: Course information and student counts
- **Halls**: Venue capacity and details
- **Supervisors**: Staff management
- **Timetables**: Generated schedule storage
- **Chat**: AI conversation history

## 📋 **Timetable Generation Constraints**

### 🔴 **RED Room Rules (Capacity: 96 students)**
- ✅ **Combination allowed**: Multiple courses can be scheduled together
- ✅ **Cross-department mixing**: Different departments can share the room
- ✅ **Small/Medium courses only**: Courses with ≤96 students
- ❌ **Large course restriction**: NO course with >96 students allowed

### 🔵 **BLUE Room Rules (Capacity: 192 students)**
- ✅ **Large course alone**: Courses with >96 students MUST be alone
- ✅ **Combination for smaller courses**: Multiple courses ≤96 students can combine
- ✅ **Total capacity**: Never exceed 192 students total
- ❌ **No mixing with large courses**: Cannot combine large courses with others

### 🎯 **Placement Algorithm**
1. **Phase 1**: Fill RED rooms with small/medium courses (≤96 students)
2. **Phase 2**: Place large courses (>96 students) alone in BLUE rooms
3. **Phase 3**: Fill remaining BLUE rooms with overflow courses
4. **Validation**: Ensure all capacity constraints are met

### 🎲 **Randomization Features**
- **Course order randomization**: Different placement sequences each generation
- **Session randomization**: Courses distributed across different time slots
- **Room combination variety**: Different courses paired together
- **Multiple valid solutions**: Generate different arrangements until satisfied

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd exam-scheduler

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up the database
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

### **Environment Variables**
```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI (for chat functionality)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL="gpt-3.5-turbo-0125"

# Email (optional, for notifications)
EMAIL_FROM="noreply@yourschool.edu"
EMAIL_HOST="smtp.yourschool.edu"
EMAIL_PORT=587
EMAIL_USER="your-email@yourschool.edu"
EMAIL_PASS="your-email-password"
```

## 📖 **Usage Guide**

### **1. Upload Course Data**
- Navigate to the courses section
- Upload a CSV file with course information
- Format: `code,title,students,department`

### **2. Configure Halls**
- Add exam venues with capacity information
- Set up RED rooms (96 capacity) and BLUE rooms (192 capacity)

### **3. Generate Timetable**
- Select start date and duration (weeks)
- Click "Generate Timetable"
- System will automatically:
  - Validate capacity constraints
  - Place large courses alone in BLUE rooms
  - Combine smaller courses efficiently
  - Ensure all courses are scheduled

### **4. Review and Export**
- View the generated timetable
- Download as PDF or CSV
- Regenerate for different arrangements if needed

## 🛠️ **API Endpoints**

### **Timetable Generation**
```
POST /api/generate-timetable
Body: { startDate: "2025-01-01", weeks: 5 }
Response: Array of scheduled sessions
```

### **Course Management**
```
GET /api/courses - List all courses
POST /api/courses - Create new course
PUT /api/courses/[id] - Update course
DELETE /api/courses/[id] - Delete course
```

### **Hall Management**
```
GET /api/halls - List all halls
POST /api/halls - Create new hall
```

### **Chat Assistant**
```
POST /api/chat - Send message to AI assistant
GET /api/chat - Retrieve chat history
```

## 🧪 **Testing**

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test files
npm test -- auth.test.ts
npm test -- verification.test.ts
```

## 📊 **Performance Considerations**

### **Scalability**
- **Database**: SQLite for development, PostgreSQL for production
- **Algorithm**: O(n²) complexity, optimized for typical course loads
- **Memory**: Efficient course placement with minimal memory footprint

### **Limitations**
- **Maximum courses**: Tested up to 500 courses
- **Session limit**: 100 sessions (10 weeks) per generation
- **Large course constraint**: Each >96 student course needs dedicated BLUE room

### **Optimization Tips**
- Use 5+ weeks for datasets with many large courses (>96 students)
- Consider 3 sessions per day for tighter schedules
- Monitor capacity utilization for efficiency

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Ensure timetable generation constraints are maintained

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs` folder
- Review the constraint rules above for timetable generation issues

## 🔮 **Future Enhancements**

- [ ] Multi-campus support
- [ ] Advanced conflict detection
- [ ] Supervisor workload balancing
- [ ] Mobile app companion
- [ ] Integration with student information systems
- [ ] Real-time collaboration features

---

**Built with ❤️ for educational institutions worldwide**