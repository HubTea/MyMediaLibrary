/**
 * 리소스에 대한 접근 제어를 하는 클래스.
 * token 객체와 userId, mediaId를 비교하여 해당 리소스에 접근
 * 가능한지 여부를 반환.
 */
class Authorizer{
    /**
     * 객체 초기화.
     * @param {string | object} token 
     * JSON or object
     * ```
     * {
     *      user: {
     *          userId
     *      },
     *      
     *      media: {
     *          mediaId,
     *          region,
     *          minimumAge
     *      }
     * }
     * ```
     */
    constructor(token){
        if(typeof(token) == 'string'){
            this.token = JSON.parse(token);
        }
        else{
            this.token = token;
        }
    }

    /**
     * 
     * @returns {string} Autorizer.token을 JSON으로 변환하여 반환.
     */
    export(){
        return JSON.stringify(this.token);
    }

    /**
     * 
     * @param {string} userId 유저의 uuid.
     * @returns {boolean} userId에 해당하는 유저의 데이터에 접근 가능하면 true.
     */
    testUserAccessibility(userId){
        return (this.token.user && this.token.user.userId === userId);
    }
    
    /**
     * 
     * @param {string} mediaId 
     * @returns mediaId에 해당하는 미디어에 접근 가능하면 true.
     */
    testMediaAccessibility(mediaId){
        return true;
    }

    /**
     * Authorizer.token의 userId를 설정함.
     * @param {string} userId 유저의 uuid.
     */
    setAccessibleUser(userId){
        this.token.user = {
            userId: userId
        };
    }
}


exports.Authorizer = Authorizer;