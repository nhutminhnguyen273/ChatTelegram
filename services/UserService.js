const jwt = require('jsonwebtoken');

class UserService {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async findByTelegramId(telegramId) {
        return await this.userModel.findOne({ telegramId });
    }

    async register(telegramId, username, password) {
        const user = new this.userModel({
            telegramId,
            username,
            password,
            isRegistered: true,
            token: null
        });
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );
        user.token = token;
        await user.save();
        return token;
    }

    async verifyPassword(telegramId, password) {
        try {
            console.log('Finding user with telegramId:', telegramId); // Debug log
            
            const user = await this.findByTelegramId(telegramId);
            if (!user) {
                console.log('User not found'); // Debug log
                return { success: false, message: 'User not found. Please register first.' };
            }

            console.log('User found, comparing password'); // Debug log
            
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                console.log('Password incorrect'); // Debug log
                return { success: false, message: 'Incorrect password. Please try again.' };
            }

            console.log('Password correct, generating token'); // Debug log
            
            const token = jwt.sign(
                { userId: user._id }, 
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );
            user.token = token;
            user.isRegistered = true;
            await user.save();
            
            console.log('Login successful'); // Debug log
            return { success: true, token, user };
        } catch (error) {
            console.error('Error in verifyPassword:', error);
            return { success: false, message: 'An error occurred during verification. Please try again.' };
        }
    }

    async verifyToken(telegramId) {
        try {
            const user = await this.findByTelegramId(telegramId);
            if (!user || !user.token) {
                return { success: false, message: 'No token found' };
            }

            const decoded = jwt.verify(user.token, process.env.JWT_SECRET);
            if (!decoded) {
                user.token = null;
                user.isRegistered = false;
                await user.save();
                return { success: false, message: 'Invalid token' };
            }

            return { success: true, user };
        } catch (error) {
            // Token hết hạn hoặc không hợp lệ
            const user = await this.findByTelegramId(telegramId);
            if (user) {
                user.token = null;
                user.isRegistered = false;
                await user.save();
            }
            return { success: false, message: 'Token expired or invalid' };
        }
    }

    async logout(telegramId) {
        const user = await this.findByTelegramId(telegramId);
        if (!user) {
            throw new Error('User not found');
        }

        // Xóa token và đánh dấu đã đăng xuất
        user.token = null;
        user.isRegistered = false;
        await user.save();
        
        return { success: true, message: 'Logged out successfully' };
    }

    async getUserProfile(telegramId) {
        return await this.findByTelegramId(telegramId);
    }

    async resetPassword(telegramId, newPassword) {
        try {
            const user = await this.findByTelegramId(telegramId);
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Cập nhật mật khẩu mới
            user.password = newPassword;
            user.token = null; // Đăng xuất khỏi tất cả các phiên
            user.isRegistered = false; // Đặt trạng thái về chưa đăng nhập
            await user.save();

            return {
                success: true,
                message: 'Password has been reset successfully',
                user
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: 'Failed to reset password. Please try again.'
            };
        }
    }
}

module.exports = UserService; 