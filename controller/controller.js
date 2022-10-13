/**
 * client는 axios 인스턴스
 */

 class Controller{
    constructor(client, session = {}){
        this.client = client;
        this.request = new Request(this.client);
        this.session = session;
    }

    async registerUser({accountId, accountPassword, nickname}){
        let response = await this.request.postUserRegistration({
            accountId: accountId,
            accountPassword: accountPassword,
            nickname: nickname
        });

        return response.headers.location;
    }

    async logIn(accountId, accountPassword){
        let response = await this.request.postLogIn({
            accountId: accountId,
            accountPassword: accountPassword
        });

        this.session.userUuid = response.data.userUuid;
        this.session.token = response.data.token;
        return this.session;
    }

    async getMyInfo(){
        return await this.getUserInfo(this.session.userUuid);
    }

    async getUserInfo(userUuid){
        let response = await this.request.fetchUserInfo(userUuid);

        return response.data;
    }

    async changeMyInfo({nickname, introduction}){
        await this.request.patchMyInfo({
            userUuid: this.session.userUuid,
            token: this.session.token,
            body: {
                nickname: nickname,
                introduction: introduction
            }
        });
    }

    async registerMedia({title, description, type, tagList}){
        let response = await this.request.postMediaRegistration({
            userUuid: this.session.userUuid,
            token: this.session.token,
            body: {
                title: title,
                description: description,
                type: type,
                tagList: tagList
            }
        });

        return response.headers.location;
    }

    async getMediaInfo(mediaUuid){
        let response = await this.request.fetchMediaInfo(mediaUuid);

        return response.data;
    }

    async uploadMedia(mediaUuid, file){
        await this.request.postMediaFile({
            mediaUuid: mediaUuid,
            token: this.session.token,
            body: file
        });
    }

    async downloadMedia(mediaUuid){
        let response = await this.request.fetchMediaFile(mediaUuid);

        return response.data;
    }

    async comment({mediaUuid, content, parentCommentUuid}){
        let response = await this.request.postComment({
            mediaUuid: mediaUuid,
            token: this.session.token,
            body: {
                writerUuid: this.session.userUuid,
                content: content,
                parentUuid: parentCommentUuid
            }
        });

        return response.headers.location;
    }

    async subscribe(uploaderUuid){
        await this.request.postSubscription({
            userUuid: this.session.userUuid,
            token: this.session.token,
            body: {
                uploaderUuid: uploaderUuid
            }
        });
    }

    async addBookmark(mediaUuid){
        await this.request.postBookmark({
            userUuid: this.session.userUuid,
            token: this.session.token,
            body: {
                mediaUuid: mediaUuid
            }
        });
    }

    async getMySubscriptionList(cursor, length){
        let response = await this.request.fetchMySubscriptionList({
            userUuid: this.session.userUuid,
            length: length,
            cursor: cursor
        });

        return response.data;
    }

    async getMyMediaList(cursor, length){
        let response = await this.request.fetchMyMediaList({
            userUuid: this.session.userUuid,
            length: length,
            cursor: cursor
        });

        return response.data;
    }

    async getMyBookmarkList(cursor, length){
        let response = await this.request.fetchMyBookmarkList({
            userUuid: this.session.userUuid,
            length: length,
            cursor: cursor
        });

        return response.data;
    }

    async getMyCommentList({cursor, length, parentCommentUuid} = {}){
        let response = await this.request.fetchMyCommentList({
            userUuid: this.session.userUuid,
            cursor: cursor,
            length: length,
            parentCommentUuid: parentCommentUuid
        });

        return response.data;
    }

    async getMediaCommentList({mediaUuid, cursor, length, parentCommentUuid}){
        let response = await this.request.fetchMediaCommentList({
            mediaUuid: mediaUuid,
            cursor: cursor,
            length: length,
            parentCommentUuid: parentCommentUuid
        });

        return response.data;
    }

    async searchMedia({tagList, sort, cursor, length}){
        let response = await this.request.fetchMediaList({
            tagList: tagList,
            sort: sort,
            cursor: cursor,
            length: length
        });

        return response.data;
    }
}

class Request{
    constructor(client){
        this.client = client;
    }

    postUserRegistration(body){
        return this.client.post('/users', body);
    }

    postLogIn(body){
        return this.client.post('/auth', body);
    }

    fetchUserInfo(userUuid){
        return this.client.get(`/users/${userUuid}/info`);
    }

    patchMyInfo({userUuid, token, body}){
        return this.client.patch(`/users/${userUuid}/info`, body, {
            headers: {
                Authorization: token
            }
        });
    }

    postMediaRegistration({userUuid, token, body}){
        return this.client.post(`/users/${userUuid}/medias`, body, {
            headers: {
                Authorization: token
            }
        });
    }

    fetchMediaInfo(mediaUuid){
        return this.client.get(`/medias/${mediaUuid}/info`);
    }

    postMediaFile({mediaUuid, token, body}){
        return this.client.post(`/medias/${mediaUuid}`, body, {
            headers: {
                Authorization: token
            }
        });
    }

    fetchMediaFile(mediaUuid){
        return this.client.get(`/medias/${mediaUuid}`);
    }

    postComment({mediaUuid, token, body}){
        return this.client.post(`/medias/${mediaUuid}/comments`, body, {
            headers: {
                Authorization: token
            }
        });
    }

    postSubscription({userUuid, token, body}){
        return this.client.post(`/users/${userUuid}/following`, body, {
            headers: {
                Authorization: token
            }
        });
    }

    postBookmark({userUuid, token, body}){
        return this.client.post(`/users/${userUuid}/bookmarks`, body, {
            headers: {
                Authorization: token
            }
        });
    }

    fetchMyMediaList({userUuid, length, cursor}){
        return this.client.get(`/users/${userUuid}/medias`, {
            params: {
                cursor: cursor,
                length: length
            }
        });
    }

    fetchMySubscriptionList({userUuid, length, cursor}){
        return this.client.get(`/users/${userUuid}/following`, {
            params: {
                cursor: cursor,
                length: length
            }
        });
    }

    fetchMyBookmarkList({userUuid, length, cursor}){
        return this.client.get(`/users/${userUuid}/bookmarks`, {
            params: {
                cursor: cursor,
                length: length
            }
        });
    }

    fetchMyCommentList({userUuid, parentCommentUuid, length, cursor}){
        return this.client.get(`/users/${userUuid}/comments`, {
            params: {
                cursor: cursor,
                length: length,
                parentCommentUuid: parentCommentUuid
            }
        });
    }

    fetchMediaCommentList({mediaUuid, parentCommentUuid, length, cursor}){
        return this.client.get(`/medias/${mediaUuid}/comments`, {
            params: {
                cursor: cursor,
                length: length,
                parentUuid: parentCommentUuid
            }
        });
    }

    fetchMediaList({tagList, sort, length, cursor}){
        return this.client.get('/medias', {
            params: {
                tag: tagList,
                sort: sort,
                cursor: cursor,
                length: length
            }
        });
    }
}


if(exports){
    module.exports = {
        Controller,
        Request
    };
}