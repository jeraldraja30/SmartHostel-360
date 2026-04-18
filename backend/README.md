# SmartHostel 360 - Django Backend

Complete Django REST API backend for SmartHostel 360 Hostel Management System.

## Features

- **JWT Authentication** - Secure token-based authentication with role-based access
- **Role-Based Access Control** - Separate permissions for Students and Wardens
- **7 Modular Apps** - Clean architecture with dedicated apps for each feature
- **CamelCase API** - Automatic snake_case to camelCase transformation for frontend compatibility
- **MySQL Database** - Production-ready relational database
- **Media File Support** - Upload hosteler photos and room images
- **Admin Panel** - Full-featured Django admin interface

## Tech Stack

- Django 5.0.1
- Django REST Framework 3.14.0
- MySQL
- JWT Authentication (djangorestframework-simplejwt)
- Python 3.10+

## Project Structure

```
backend/
├── hostel_management/      # Django project settings
├── accounts/               # User authentication
├── hostel/                 # Hosteler management
├── rooms/                  # Room management
├── outpass/                # Outpass system
├── payments/               # Payment processing
├── feedback/               # Feedback system
├── notifications/          # Notification system
├── core/                   # Shared utilities
└── media/                  # Uploaded files
```

## Setup Instructions

### 1. Prerequisites

- Python 3.10 or higher
- MySQL 5.7 or higher
- pip package manager

### 2. Create MySQL Database

```sql
CREATE DATABASE hostel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Clone and Navigate

```bash
cd "c:\Users\Raja jerald\OneDrive\Desktop\SmartHostel 360\backend"
```

### 4. Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure Environment Variables

Copy `.env.example` to `.env` and update:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_NAME=hostel_db
DATABASE_USER=root
DATABASE_PASSWORD=yourpassword
DATABASE_HOST=localhost
DATABASE_PORT=3306
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```

### 7. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 8. Create Superuser

```bash
python manage.py createsuperuser
raja
```

### 9. Load Sample Data

```bash
python manage.py seed_data
```

This creates:
- Warden user: `warden` / `warden123`
- Student users: `Admin001` / `Rahul123`, `Admin002` / `Priya123`
- Sample rooms, hostelers, outpasses, payments, and feedback

### 10. Run Development Server

```bash
python manage.py runserver
```

Server will start at `http://127.0.0.1:8000/`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/profile/` - Get current user profile

### Aggregate Data
- `GET /api/hostel-data/` - Get all hostel data (dashboard)

### Hostelers
- `GET /api/hostelers/` - List all hostelers
- `POST /api/hostelers/` - Create hosteler (Warden only)
- `GET /api/hostelers/{id}/` - Get hosteler details
- `PUT /api/hostelers/{id}/` - Update hosteler (Warden only)
- `DELETE /api/hostelers/{id}/` - Delete hosteler (Warden only)

### Rooms
- `GET /api/rooms/` - List all rooms
- `POST /api/rooms/` - Create room (Warden only)
- `PUT /api/rooms/{id}/` - Update room (Warden only)
- `DELETE /api/rooms/{id}/` - Delete room (Warden only)

### Outpasses
- `GET /api/outpasses/` - List outpasses (filtered by role)
- `POST /api/outpasses/` - Submit outpass
- `PATCH /api/outpasses/{id}/` - Update outpass
- `POST /api/outpasses/{id}/set_status/` - Approve/Reject (Warden only)

### Payments
- `GET /api/payments/` - List payments (filtered by role)
- `POST /api/payments/` - Create payment

### Feedback
- `GET /api/feedback/` - List all feedback
- `POST /api/feedback/` - Submit feedback
- `PATCH /api/feedback/{id}/` - Reply to feedback (Warden only)

## Authentication

All endpoints (except login) require JWT authentication. Include token in headers:

```
Authorization: Bearer <access_token>
```

### Login Example

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "warden", "password": "warden123"}'
```

Response:
```json
{
  "access": "eyJ0eXAiOi...",
  "refresh": "eyJ0eXAiOi...",
  "user": {
    "id": 1,
    "username": "warden",
    "role": "warden",
    "email": "warden@hostel.com"
  }
}
```

## Frontend Integration

1. Update frontend `API_BASE_URL` in `assets/js/app.js`:
   ```javascript
   const API_BASE_URL = 'http://127.0.0.1:8000/api';
   ```

2. Open `index.html` in browser (use Live Server or similar)

3. Login with:
   - Warden: `warden` / `warden123`
   - Student: `Admin001` / `Rahul123`

4. All data will now be fetched from the Django backend

## Admin Panel

Access at: `http://127.0.0.1:8000/admin/`

Login with superuser credentials created in step 8.

## Database Models

### User (accounts)
- Custom user model with `role` field (student/warden)
- Links to hosteler profile for students

### Hosteler (hostel)
- Complete student information
- Academic details (college, course, department, year)
- Room allocation (room, bed)
- Emergency contacts

### Room (rooms)
- Room details (number, block, floor, type)
- Bed tracking (total_beds, available_beds)
- Auto-updates availability

### Outpass (outpass)
- Outpass requests with approval workflow
- Status tracking (pending, approved, rejected)
- Warden comments

### Payment (payments)
- Fee payment records
- Multiple payment methods (cash, card, UPI)
- Auto-generated invoice numbers

### Feedback (feedback)
- Student feedback and complaints
- Warden replies
- Status tracking

### Notification (notifications)
- User notifications
- Read/unread tracking

## CamelCase Serialization

All API responses automatically convert from snake_case (database) to camelCase (frontend):

Database field: `student_name` → API response: `studentName`

This is handled by the `CamelCaseModelSerializer` in `core/serializers.py`.

## Role-Based Permissions

- **Students**: Can view own data, submit outpasses/feedback, view available rooms
- **Wardens**: Full access - can approve outpasses, manage rooms, view all data

## Development

### Adding New Fields

1. Add field to model in `models.py`
2. Create migration: `python manage.py makemigrations`
3. Run migration: `python manage.py migrate`
4. Update serializer if needed

### Running Tests

```bash
python manage.py test
```

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Update `ALLOWED_HOSTS` with your domain
3. Collect static files: `python manage.py collectstatic`
4. Use production WSGI server (gunicorn, uWSGI)
5. Configure nginx/Apache reverse proxy
6. Enable HTTPS
7. Use strong `SECRET_KEY`

## Troubleshooting

### MySQL Connection Error
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database `hostel_db` exists

### CORS Errors
- Update `CORS_ALLOWED_ORIGINS` in `.env` with your frontend URL
- Restart Django server after changing `.env`

### Import Errors
- Activate virtual environment: `venv\Scripts\activate`
- Install requirements: `pip install -r requirements.txt`

## Support

For issues or questions, refer to:
- Django documentation: https://docs.djangoproject.com/
- DRF documentation: https://www.django-rest-framework.org/
- Frontend code in `../` directory

## License

MIT License - See LICENSE file
