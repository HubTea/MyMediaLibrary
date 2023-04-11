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

## 주요 기능
### 조회수 Pagination
    조회수 내림차순으로 미디어를 조회하는 기능을 넣고 싶었지만 이를 위해서는 조회수 
    컬럼에 인덱스를 설정해야 했습니다. 하지만 조회수는 업데이트가 빈번하므로 인덱스를 
    섣불리 설정하기가 난감했습니다.

    따라서 Media 테이블의 조회수 컬럼에 인덱스를 설정하되 Media 테이블과 1:1 관계인 
    MediaViewCount 테이블을 만들었습니다. 실제 조회수 업데이트는 MediaViewCount 
    테이블에서 수행하고 이 테이블의 조회수 컬럼으로 주기적으로 Media 테이블의 조회수 
    컬럼에 업데이트하기로 했습니다.

    Media 테이블에 새 컬럼을 추가한 대신 별도의 테이블을 만든 것은 두 가지 우려사항 
    때문입니다.
        1. PostgreSQL에서는 로우를 업데이트 할 때 기존 로우를 변경하는 것이 아니라,
        기존 로우에는 간단한 표시만 하고 남겨둔 채 업데이트된 버전의 로우를 새로 
        추가합니다. 오래된 버전의 로우는 완전히 필요가 없어지게 되고 나면 주기적으로 
        정리되지만 이 속도가 업데이트 속도보다 느리면 테이블의 물리적 크기가 커져 
        다른 쿼리 성능에 영향을 줄 수 있습니다. 분리된 테이블의 업데이트는 Media 
        테이블에 영향을 주지 않으므로 이런 문제에 영향을 받지 않습니다.

        2. 업데이트 쿼리가 실행될 때 해당되는 로우에 락이 걸려서 같은 로우에 대한 
        업데이트는 동시에 하나씩만 실행되므로 조회수 업데이트가 많은 미디어의 경우 
        제목을 업데이트하는 것이 조회수 업데이트로 인해 약간이나마 지연될 수 있습니다.
        하지만 위의 경우와 마찬가지로 테이블이 분리된 덕분에 Media 테이블의 업데이트가
        영향을 받지 않습니다.

<br>

### 조회수 Pagination에서 누락 항목 탐지
    조회수는 수시로 업데이트되므로 pagination에서 누락되는 항목이 발생할 수 있습니다.
    테이블이 다음과 같을 때,

    id      view    ...
    1       100
    2       99
    3       98
    4       97
    5       96

    A 사용자가 조회수 내림차순으로 길이 2의 페이지를 요청하면 1번 미디어, 2번 미디어의 
    정보와 함께 다음 요청에 사용할 커서값으로 (3, 98)을 응답으로 전달합니다.

    바로 이어서 조회수가 업데이트되어 테이블이 다음과 같이 되고

    id      view    ...
    4       200
    5       199
    1       100
    2       99
    3       98

    이 다음 A 사용자가 이전 요청에서 받은 커서값과 함께 요청을 보내면 3번 미디어의 
    정보와 이것이 페이지의 끝이라는 응답을 받게 될 것입니다. 4번과 5번이 누락된 것인데
    이러한 사실을 사용자에게 알려줄 필요가 있다고 생각했습니다.

    이를 위해서는 현재 사용자가 어떤 미디어의 정보를 받았는지에 대한 정보가 
    필요했습니다. 이를 위해 MediaPaginationSession 테이블과
    MediaPaginationSessionItem 테이블을 만들고 조회수 내림차순 페이지네이션 처리 
    과정을 다음처럼 변경했습니다.
        1. 사용자 요청에 세션 id가 없으면 세션 생성
        2. 사용자 요청에 있는 조회수보다 큰 미디어의 id 집합에서 사용자 세션에 있는 
        미디어 id 집합을 뺀 결과 남는 id가 있는지 확인
        2. 사용자 요청대로 페이지 쿼리
        3. 쿼리된 페이지에 포함된 미디어의 id들과 2번 과정에서 나온 id들을 사용자 
        세션에 추가
        4. 페이지 정보와 함께 2번 과정에서 나온 미디어의 정보, 세션id도 같이 응답으로
        보냄

    이렇게 해결했지만 추가적인 고려사항이 있었습니다.
    세션에 중복된 미디어 id를 넣는 경우인데 이 경우는 사용자가 보낸 이전 요청과 다음 
    요청 사이의 시간보다 데이터의 쓰기 서버/읽기 서버 사이의 동기화 시간이 더 길 경우,
    사용자가 이미 조회한 페이지를 다시 요청하는 경우에 발생합니다.
    이는 MediaPaginationSessionItem의 primary key를 적절히 설정함으로써 
    해결했습니다.

## 더 나아가서
    위의 누락 탐지 기능을 만드는 과정에서 새로 만들 세션 테이블을 정규화하긴 했지만 
    정규화한것과 그렇게 하지 않은 것의 장단점을 고민했었습니다.

        1. 정규화를 하면 세션 id로 빠르게 필터링하기 위해 SessionItem 테이블에 
        인덱스가 필요해져서 기존 세션에 항목 추가하는 성능이 나빠지지만 
        애플리케이션에서는 쿼리 하나만 실행하면 되므로 편합니다.

        2. 정규화를 하지 않으면, 즉, 세션 테이블에 문자열 하나로 세션에 들어갈 항목을
        전부 넣어서 관리하면 기존 세션에 항목 추가하는 성능은 좋지만 기존에 쿼리
        하나로 처리할 수 있는 것을 애플리케이션에서 구현해야 하고 애플리케이션의
        메모리도 신경써야 합니다. 네트워크 사용량과 추가적인 round trip time 발생도
        고려해야 합니다. 또한 세션 내에 중복된 항목이 있는지 검사하기도 어렵습니다.
    
    두 번째 방법이 좋은 방법인지에 대해서는 여전히 고민 중이고, RDBMS가 아닌 다른 
    데이터베이스를 쓰면 더 좋을지에 대해서도 고민 중입니다.
    
