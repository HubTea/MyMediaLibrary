# MyMediaLibrary
멀티미디어 업로드/감상 서비스

[api 링크](./api%20spec.md)   
벤치마크 폴더: 성능 측정 자료

<br>

## 기능별 연관 소스 파일
### 프로그램 엔트리
main.js

<br>

### 라우터
usersRouter.js<br>

    계정 등록, 정보 수정, 구독, 북마크, 컨텐츠 업로드,
    업로드한 컨텐츠 / 작성한 댓글 / 북마크 / 구독 목록 조회

mediaRouter.js<br>

    댓글 작성, 태그 검색, 정렬, 댓글 목록 조회,
    컨텐츠 다운로드

authRouter.js

    로그인 / JWT 발행

<br>

### 데이터베이스
model.js<br>

    Sequelize ORM 모델 정의

repository/converter.js<br>

    Sequelize 함수의 반환 형식을 repository 레이어의 형식으로 변환
    하는 함수들 정의

repository/bookmarkRepository.js<br>
repository/commentRepository.js<br>
repository/followingListRepository.js<br>
repository/mediaListRepository.js<br>
repository/mediaRepository.js<br>
repository/userRepository.js

    쿼리 수행

<br>

### 페이지네이션
pagination.js

    커서 기반 페이지네이션을 수행하는 Pagination 클래스 정의

<br>

### 유효성 검증
checker.js

    uuid, cursor, tagList 등 클라이언트가 보낸 값들이 서버에서
    지정한 형식과 조건을 따르는지 검사하는 함수들 정의

<br>

### 보안, 인증
authorizer.js<br>
    
    클라이언트의 요청을 승인하기 위한 Authorizer 클래스 정의

digest.js<br>

    패스워드로부터 해시값 생성

securityService.js

    보안 관련 함수에 사용되는 파라미터 값들 설정

<br>

### 프로그램 설정
serverConfig.js

    포트, 비밀키 파일 경로, sequelize 인스턴스 등 전역 변수 설정

<br>

### 예외 처리
error.js<br>

    HTTP 상태코드, 에러 메시지를 묶은 예외 클래스 정의

errorHandler.js

    예외 로깅, 클라이언트에게 적절한 응답 보내는 함수 정의

<br>

### AWS S3
storageService.js

    AWS S3를 이용하기 위한 객체 생성

