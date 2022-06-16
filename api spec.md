# MyMediaLibrary API Spec

## 목차

## 인증

인증이 필요한 요청에는 Authorization헤더와 다음의 과정으로 획득한 토큰을 함께 보내야 함.  인증이 필요 없는 요청은 문서에 반드시 표시.

권한이 필요한 요청에서 토큰이 없는 경우 응답

```jsx
401 Unauthorized
```

주어진 토큰의 권한으로는 처리할 수 없는 요청인 경우 응답

```jsx
403 Forbidden
```

### 토큰 발행

요청

```jsx
//인증x
GET /v1/auth

{
	"accountId": string
		알파벳 대소문자, 숫자로만 구성된 문자열

	"accountPassword": string
		알파벳 대소문자, 숫자, 특수문자로 구성된 최소 길이
		12이상 30이하인 문자열
}
```

응답

성공시

```jsx
200 OK

{
	"token": string
}
```

accountId가 존재하지 않을 때

```jsx
400 Bad Request

{
	"error": {
		"code": "NotExistAccount"
		"message": "Account ID does not exist"
	}
}
```

accountPassword가 일치하지 않을 때

```jsx
400 Bad Request

{
	"error": {
		"code": "WrongPassword"
		"message": "Wrong password inputted"
	}
}
```

## 사용자 정보

### 계정 등록

요청

```jsx
//인증x
POST /v1/users

{
	"accountId": string
		알파벳 대소문자, 숫자로만 구성된 문자열

	"accountPassword": string
		알파벳 대소문자, 숫자, 특수문자로 구성된 최소 길이
		12이상 30이하인 문자열

	"nickname": string
}
```

응답

성공시

```jsx
201 Created
Location: /v1/users/{userId}
```

파라미터가 제한사항을 위반했을 때

```jsx
400 BadRequest

{
	"error": {
		"code": "InvalidParameter",
		"message": "Account ID or password do not meet limit"
	}
}
```

### 계정 비밀번호 변경

요청

```jsx
PUT /v1/users/{userId}/password
Authorization: token

{
	"newAccountPassword": string
		알파벳 대소문자, 숫자, 특수문자로 구성된 최소 길이
		12이상 30이하인 문자열
}
```

응답

성공시

```jsx
200 OK
```

파라미터가 제한사항을 위반했을 때

```jsx
400 BadRequest

{
	"error": {
		"code": "InvalidParameter",
		"message": "Account ID or password do not meet limit"
	}
}
```

### 사용자 정보 조회

닉네임, 소개문, 썸네일 조회

요청

```jsx
//인증x
GET /v1/users/{userId}/info
```

응답

성공시

```jsx
200 OK

{
	"nickname": string
	"description": string
	"thumbnailUrl": string
		썸네일 이미지 파일 URL
}
```

### 사용자 정보 업데이트

닉네임, 소개문 변경

요청

```jsx
PATCH /v1/users/{userId}/info
Authorization: token

{
	"nickname": string
	"description": string
}
```

응답

성공시

```jsx
200 OK
```

썸네일 변경

요청

```jsx
PATCH /v1/users/{userId}/thumbnail
Authorization: token
Content-Type: image/jpeg

thumbnail image file
```

응답

성공시

```jsx
200 OK
Location: thumbnail url
```

### 미디어 업로드

요청

```jsx
POST /v1/users/{userId}/medias
Authorization: token

{
	"title": string
	"description": string
	"thumbnail": string
		썸네일 이미지 파일을 base64로 표현한 문자열

	"media": [
		{
			"type": string
				해당 미디어의 종류.
				"img", "video"중 하나

			"file": string
				파일을 base64로 표현한 문자열
		},
		...
	]
}
```

응답

성공시

```jsx
200 OK
Location: /v1/medias/{mediaId}
```

파일이 너무 클 때

```jsx
413 Payload Too Large
```

### 업로드한 미디어 목록

요청

```jsx
//인증x
GET /v1/users/{userId}/medias

{
	"range": {
		"cursor": string
			클라이언트가 지금까지 응답받은 항목 중 마지막 것의 정렬키
			생략하면 목록의 맨 앞을 요청한 것으로 간주

		"limit": integer
			응답받을 항목의 최대 개수

		"sorting": string
	}
}
```

응답

```jsx
200 OK

{
	"uploadList": array
		미디어의 mediaID 배열

	"realRange": {
		"cursor": string
			응답으로 보낸 항목 중 마지막 것의 정렬키

		"limit": integer
			응답으로 보낸 항목의 개수

		"sorting": string
	}
}
```

### 구독 목록

요청

```jsx
//인증x
GET /v1/users/{userId}/subscribes

{
	"range": {
		"cursor": string
			클라이언트가 지금까지 응답받은 항목 중 마지막 것의 정렬키
			생략하면 목록의 맨 앞을 요청한 것으로 간주

		"limit": integer
			응답받을 항목의 최대 개수

		"sorting": string
	}
}
```

응답

성공시

```jsx
200 OK

{
	"subscribeList": array
		구독한 사용자의 userID 배열
	
	"realRange": {
		"cursor": string
			응답으로 보낸 항목 중 마지막 것의 정렬키

		"limit": integer
			응답으로 보낸 항목의 개수

		"sorting": string
	}
}
```

### 북마크 목록

요청

```jsx
//인증x
GET /v1/users/{userId}/bookmarks

{
	"range": {
		"cursor": string
			클라이언트가 지금까지 응답받은 항목 중 마지막 것의 정렬키
			생략하면 목록의 맨 앞을 요청한 것으로 간주

		"limit": integer
			응답받을 항목의 최대 개수

		"sorting": string
	}
}
```

응답

```jsx
200 OK

{
	"bookmarkList": array
		북마크한 미디어의 mediaID 배열
	
	"realRange": {
		"cursor": string
			응답으로 보낸 항목 중 마지막 것의 정렬키

		"limit": integer
			응답으로 보낸 항목의 개수

		"sorting": string
	}
}
```

### 작성한 댓글 목록

요청

```jsx
//인증x
GET /v1/users/{userId}/comments

{
	"range": {
		"cursor": string
			클라이언트가 지금까지 응답받은 항목 중 마지막 것의 정렬키
			생략하면 목록의 맨 앞을 요청한 것으로 간주

		"limit": integer
			응답받을 항목의 최대 개수

		"sorting": string
	}
}
```

응답

성공시

```jsx
200 OK

{
	"commentList": array
		comment의 commentId 배열

	"realRange": {
		"cursor": string
			응답으로 보낸 항목 중 마지막 것의 정렬키

		"limit": integer
			응답으로 보낸 항목의 개수

		"sorting": string
	}
}
```

## 미디어

### 미디어 접근

요청

```jsx
//인증x
GET /v1/medias/{mediaId}
```

응답

성공시

```jsx
200 OK

{
	"media": [
		{
			"type": string
				미디어 종류

			"fileUrl": string
				파일의 실제 URL
		},
		...
	]
}
```

### 미디어 검색

요청

```jsx
//인증x
GET /v1/medias

{
	"query": string
		검색할 태그들을 담고있는 문자열
	
	"range": {
		"cursor": string
			클라이언트가 지금까지 응답받은 항목 중 마지막 것의 정렬키
			생략하면 목록의 맨 앞을 요청한 것으로 간주

		"limit": integer
			응답받을 항목의 최대 개수

		"sorting": string
	}
}
```

응답

성공시

```jsx
200 OK

{
	"searchResult": array
		미디어의 URL 배열
		/v1/medias/{mediaId}

	"realRange": {
		"cursor": string
			응답으로 보낸 항목 중 마지막 것의 정렬키

		"limit": integer
			응답으로 보낸 항목의 개수

		"sorting": string
	}
}
```

### 달린 댓글 목록 획득

요청

```jsx
//인증x
GET /v1/medias/{mediaId}/comments

{
	"range": {
		"cursor": string
			클라이언트가 지금까지 응답받은 항목 중 마지막 것의 정렬키
			생략하면 목록의 맨 앞을 요청한 것으로 간주

		"limit": integer
			응답받을 항목의 최대 개수

		"sorting": string
	}
}
```

응답

```jsx
200 OK

{
	"commentList": [
		{
			"commentId": string
			"parentComment": string
		},
		...
	]
	
	"realRange": {
		"cursor": string
			응답으로 보낸 항목 중 마지막 것의 정렬키

		"limit": integer
			응답으로 보낸 항목의 개수

		"sorting": string
	}
}
```