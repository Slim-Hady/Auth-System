class UserDTO {
    /**
     * 
     * @param {object} user 
     * @returns {object}
     */
    static formatUser(user){
        return {
            username: user.userName,
            email: user.email,
            role: user.role
        }
    }
    /**
     * 
     * @param {Array} users 
     * @returns {Array}
     */
    static formatAllUsers(users){
        return users.map(user => UserDTO.formatUser(user));
    }
}

module.exports = UserDTO;