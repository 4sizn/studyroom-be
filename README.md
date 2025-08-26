# Chat Room Service

방 개념의 실시간 채팅 서비스 백엔드 API

## 🚀 기술 스택

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Language**: TypeScript

## 🏗️ 주요 기능

### 인증
- 사용자 회원가입/로그인
- JWT 토큰 기반 인증

### 방 관리
- 방 생성 (관리자가 소유자가 됨)
- 방 목록 조회
- 초대 코드를 통한 방 접근
- 자동 승인 / 관리자 승인 옵션

### 멤버십 관리
- 방 참여 요청
- 관리자의 참여 승인/거절
- 멤버 상태 관리 (활성, 강퇴, 차단)

### 실시간 채팅
- Socket.IO를 통한 실시간 메시지
- 사용자 온라인 상태 공유
- 타이핑 상태 표시
- 방 입장/퇴장 알림

## 🗄️ 데이터베이스 스키마

### 주요 모델
- **User**: 사용자 정보
- **Room**: 방 정보 (관리자, 자동승인 설정 등)
- **RoomMember**: 사용자-방 멤버십 관계
- **Message**: 채팅 메시지
- **JoinRequest**: 방 참여 요청
- **UserStatus**: 사용자 온라인 상태

## 🐳 실행 방법

### 1. 의존성 설치
\`\`\`bash
npm install
\`\`\`

### 2. 환경변수 설정
\`.env\` 파일에서 설정 확인:
\`\`\`
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatroom?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="1d"
PORT=3000
\`\`\`

### 3. 데이터베이스 & Redis 실행
\`\`\`bash
docker-compose up -d
\`\`\`

### 4. 데이터베이스 마이그레이션
\`\`\`bash
npx prisma migrate dev
\`\`\`

### 5. 애플리케이션 실행
\`\`\`bash
npm run start:dev
\`\`\`

## 📡 API 엔드포인트

### 인증
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인

### 방 관리
- `GET /rooms` - 방 목록 조회
- `POST /rooms` - 방 생성
- `GET /rooms/:id` - 방 상세 조회
- `GET /rooms/invite/:inviteCode` - 초대코드로 방 조회
- `POST /rooms/:id/join` - 방 참여 요청
- `GET /rooms/:id/requests` - 참여 요청 목록 (관리자만)
- `PATCH /rooms/requests/:requestId/approve` - 참여 승인
- `PATCH /rooms/requests/:requestId/reject` - 참여 거절
- `GET /rooms/my-rooms` - 내가 속한 방 목록

### 메시지
- `GET /messages/room/:roomId` - 방의 메시지 목록

## 🔌 Socket.IO 이벤트

### 클라이언트 → 서버
- `joinRoom` - 방 입장
- `leaveRoom` - 방 퇴장  
- `sendMessage` - 메시지 전송
- `typing` - 타이핑 상태

### 서버 → 클라이언트
- `newMessage` - 새 메시지
- `userJoined` - 사용자 입장
- `userLeft` - 사용자 퇴장
- `userStatusChanged` - 사용자 상태 변경
- `userTyping` - 사용자 타이핑 상태

## 🔐 인증

WebSocket 연결 시 JWT 토큰 필요:
\`\`\`javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
\`\`\`

REST API는 Authorization 헤더에 Bearer 토큰 포함:
\`\`\`
Authorization: Bearer your-jwt-token
\`\`\`

## 👥 사용자 가이드

### 🎯 빠른 시작하기

#### 1️⃣ 회원가입 및 로그인
\`\`\`bash
# 회원가입
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "myusername",
    "password": "password123"
  }'

# 로그인
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
\`\`\`

#### 2️⃣ 방 생성하기
\`\`\`bash
# 자동 승인 방 만들기
curl -X POST http://localhost:3000/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "우리팀 채팅방",
    "description": "프로젝트 논의용 채팅방",
    "autoJoin": true
  }'

# 승인 필요한 방 만들기
curl -X POST http://localhost:3000/rooms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP 채팅방",
    "description": "관리자 승인 필요",
    "autoJoin": false
  }'
\`\`\`

#### 3️⃣ 방 목록 확인 및 참여
\`\`\`bash
# 모든 방 목록 보기
curl -X GET http://localhost:3000/rooms \
  -H "Authorization: Bearer YOUR_TOKEN"

# 특정 방에 참여하기
curl -X POST http://localhost:3000/rooms/ROOM_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요! 참여하고 싶습니다."
  }'
\`\`\`

#### 4️⃣ 관리자가 참여 요청 관리하기
\`\`\`bash
# 내 방의 대기중인 참여 요청 확인
curl -X GET http://localhost:3000/rooms/ROOM_ID/requests \
  -H "Authorization: Bearer YOUR_TOKEN"

# 참여 요청 승인
curl -X PATCH http://localhost:3000/rooms/requests/REQUEST_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN"

# 참여 요청 거절
curl -X PATCH http://localhost:3000/rooms/requests/REQUEST_ID/reject \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### 📱 클라이언트 연결 예제

#### Socket.IO 클라이언트 (JavaScript)
\`\`\`javascript
import { io } from 'socket.io-client';

// 서버 연결 (JWT 토큰 필요)
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE'
  }
});

// 방 입장
socket.emit('joinRoom', { roomId: 'ROOM_ID' });

// 메시지 전송
socket.emit('sendMessage', {
  content: '안녕하세요!',
  roomId: 'ROOM_ID'
});

// 메시지 수신
socket.on('newMessage', (message) => {
  console.log('새 메시지:', message);
});

// 사용자 상태 변경 수신
socket.on('userStatusChanged', (status) => {
  console.log('사용자 상태 변경:', status);
});

// 타이핑 상태 전송
socket.emit('typing', { 
  roomId: 'ROOM_ID', 
  isTyping: true 
});
\`\`\`

#### 초대 링크로 방 접근하기
\`\`\`bash
# 초대 코드로 방 정보 확인
curl -X GET http://localhost:3000/rooms/invite/INVITE_CODE \
  -H "Authorization: Bearer YOUR_TOKEN"

# 해당 방에 참여 신청
curl -X POST http://localhost:3000/rooms/ROOM_ID/join \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

### 🔄 일반적인 사용 흐름

1. **회원가입/로그인** → JWT 토큰 받기
2. **방 목록 조회** → 참여할 방 선택하거나 새 방 생성
3. **방 참여** → 자동 승인되거나 관리자 승인 대기
4. **Socket.IO 연결** → 실시간 채팅 시작
5. **방 입장** → \`joinRoom\` 이벤트 전송
6. **채팅하기** → \`sendMessage\`로 메시지 전송, \`newMessage\`로 수신

### 🎮 테스트해보기

서버가 실행된 후:
1. Postman이나 curl로 회원가입/로그인 테스트
2. 방 생성 및 참여 테스트
3. Socket.IO 클라이언트로 실시간 채팅 테스트

### 🐛 문제 해결

**Docker가 없는 경우:**
- PostgreSQL, Redis를 직접 설치하고 \`.env\`의 연결 정보 수정

**포트 충돌:**
- \`.env\`에서 \`PORT=3001\`로 변경하거나 다른 포트 사용

**JWT 토큰 오류:**
- \`.env\`의 \`JWT_SECRET\` 값이 설정되어 있는지 확인