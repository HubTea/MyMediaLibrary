# MyMediaLibrary API Spec

## 목차

# 에러 코드

권한이 필요한 요청에서 토큰이 없는 경우 또는 필수적인 파라미터가 없는 경우

```jsx
400 Bad request

{
	code: "PARAMETER_OMITTED",
	message: ...
}
```

주어진 토큰의 권한으로는 처리할 수 없는 요청인 경우 응답

```jsx
403 Forbidden

{
	code: "INVALID_TOKEN",
	message: ...
}
```

파라미터가 제한사항을 위반했을 때

```jsx
400 BadRequest

{
		code: "IllegalParameter",
		message: ...
}
```

## 인증

### 토큰 발행

요청

```jsx
//인증x
GET /v1/auth

{
	accountId: string
	accountPassword: string
}

accountId, accountPassword는 알파벳, 숫자, 띄어쓰기만 가능.
accountId는 최대길이 30
accountPassword는 최소길이 12, 최대길이 30
```

응답

성공시

```jsx
200 OK

{
	userUuid: string
	token: string
}
```

비밀번호가 일치하지 않을 때

```jsx
400 Bad request

{
	code: "WRONG_PASSWORD",
	message: ...
}
```

## 사용자 정보

### 계정 등록

요청

```jsx
//인증x
POST /v1/users

{
	accountId: string
	accountPassword: string
	nickname: string
}

nickname은 알파벳, 숫자, 띄어쓰기로만 구성된 최대길이 255의 문자열
```

응답

성공시

```jsx
201 Created
Location: 새로 생성된 유저의 uuid
```

### 사용자 정보 조회

닉네임, 소개문, 썸네일 조회

요청

```jsx
//인증x
GET /v1/users/{userUuid}/info
```

응답

성공시

```jsx
200 OK

{
	nickname: string
	introduction: string
}
```

### 사용자 정보 업데이트

닉네임, 소개문 변경

요청

```jsx
PATCH /v1/users/{userUuid}/info
Authorization: token

{
	nickname: string
	introduction: string
}

introduction의 제한사항은 nickname과 동일
```

응답

성공시

```jsx
200 OK
```

### 미디어 정보 등록

요청

```jsx
POST /v1/users/{userUuid}/medias
Authorization: token

{
	title: string
	description: string,
	type: string
}

title, description은 알파벳, 숫자, 띄어쓰기로 구성된
최대길이 255의 문자열.
type은 'image/png', 'image/jpeg', 'video/mp4' 중 하나.
```

응답

성공시

```jsx
201 Created
Location: 새로 생성된 미디어의 uuid
```

### 업로드한 미디어 목록 조회

요청

```jsx
//인증x
GET /v1/users/{userUuid}/medias

{
	length: number | undefined,
	cursor: string | undefined
}

length는 1 이상 100 이하인 정수. 생략됐을 때 기본값은 50
cursor는 반환받을 목록의 제일 첫번째 요소를 가리키는 
정수_정수 형식의 문자열. 생략됐을 때에는 전체 목록의 첫번째
요소를 가리키는 값이 지정됨.
```

응답

```jsx
200 OK

{
	cursor: string,
	list: Array<{
			uuid: string,
			title: string,
			type: string,
			updateTime: string,
			viewCount: number,
			dislikeCount: number
	}>
}

cursor: 다음 목록을 조회할 때 요청의 cursor 파라미터데 사용해야 하는 값.
uuid: 미디어의 uuid.
```

### 구독 목록 조회

요청

```jsx
GET /v1/users/{userUuid}/following

{
	cursor: string | undefined,
	length: number | undefined
}
```

응답

성공시

```jsx
200 OK

{
	cursor: string,
	list: Array<{
		uuid: string,
		nickname: string
	}>
}

uuid: 구독중인 유저의 uuid
```

### 유저 구독

요청

```jsx
POST /v1/users/{userUuid}/following
Authorization: token

{
	"uploaderUuid": string
}

uploaderUuid: 구독할 유저의 uuid
```

응답

성공시

```jsx
200 OK
```

### 북마크 목록

요청

```jsx
//인증x
GET /v1/users/{userUuid}/bookmarks

{
	cursor: string | undefined,
	length: number | undefined
}
```

응답

```jsx
200 OK

{
	cursor: string,
	list: Array<{
		uuid: string,
		title: string,
		type: string,
		updateTime: stirng,
		viewCount: number,
		dislikeCount: number,
		uploader: {
			uuid: string,
			nickname: string
		}
	}>
}
```

### 북마크 추가

요청

```jsx
POST /v1/users/{userUuid}/bookmarks
Authorization: token

{
	mediaUuid: string
}

mediaUuid: 구독할 미디어의 uuid
```

응답

성공시

```jsx
200 Ok
```

### 작성한 댓글 목록

요청

```jsx
//인증x
GET /v1/users/{userUuid}/comments

{
	cursor: string | undefined,
	length: number | undefined,
	parentUuid: string | undefined
}

parentUuid: 댓글에 대한 답글 목록을 조회할 때의 부모 댓글 uuid.
```

응답

성공시

```jsx
200 OK

{
	cursor: string,
	list: Array<{
		uuid: string,
		writer: {
			uuid: string,
			nickname: string,
		},
		media: {
			uuid: string,
			nickname: string
		},
		content: string,
		createdAt: string,
		updatedAt: string
	}>
}

content: 댓글 내용

```

## 미디어

### 미디어 파일 업로드

요청

```jsx
POST /v1/medias/{mediaUuid}
Authorization: token
Content-Type: video/mp4 | image/jpeg | image/png

file content
```

### 미디어 파일 다운로드

요청

```jsx
//인증x
GET /v1/medias/{mediaUuid}
```

응답

성공시

```jsx
200 OK

file content
```

### 미디어 정보 조회

요청

```jsx
GET /v1/medias/{mediaUuid}/info
```

응답

성공시

```jsx
200 Ok

{
	title: string,
	description: string,
	type: string,
	updateTime: string,
	viewCount: number,
	dislikeCount: number,
	uploader: {
		uuid: string,
		nickname: string
	}
}
```

### 미디어 검색

요청

```jsx
//인증x
GET /v1/medias
```

응답

성공시

```jsx
200 OK

{
	cursor: string,
	list: Array<{
		uuid: string,
		title: string,
		type: string,
		updateTime: string,
		viewCount: number,
		dislikeCount: number,
		uploader: {
			uuid: string,
			nickname: string
		}
	}>
}
```

### 달린 댓글 목록 획득

요청

```jsx
//인증x
GET /v1/medias/{mediaUuid}/comments

{
	cursor: string | undefined,
	length: number | undefined,
	parentUuid: string | undefined
}
```

응답

```jsx
200 OK

{
	cursor: string,
	list: Array<{
		uuid: string,
		writer: {
			uuid: string,
			nickname: string
		},
		content: string,
		createdAt: string,
		updatedAt: string
	}>
}
```

### 미디어에 댓글 달기

요청

```jsx
POST /v1/medias/{mediaUuid}/comments

{
	writerUuid: string,
	content: string,
	parentUuid: string | undefined
}
```

응답

성공시

```jsx
201 Created
Location: 생성된 댓글의 uuid
```