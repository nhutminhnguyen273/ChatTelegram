const Keyboards = require('../utils/keyboards');

class UserController {
    constructor(userService, bookingService) {
        this.userService = userService;
        this.bookingService = bookingService;
    }

    async handleStart(ctx) {
        try {
            // Kiểm tra token
            const tokenResult = await this.userService.verifyToken(ctx.from.id);
            
            if (!tokenResult.success) {
                return ctx.reply(
                    'Welcome to the Tour Booking Bot! 🎉\n\n' +
                    'Please register or login to continue:',
                    Keyboards.getAuthMenu()
                );
            }

            return ctx.reply(
                `Welcome back, ${tokenResult.user.username}! 👋\n\n` +
                'What would you like to do?',
                Keyboards.getMainMenu()
            );
        } catch (error) {
            console.error('Start command error:', error);
            return ctx.reply('Sorry, something went wrong. Please try again later.');
        }
    }

    async handleRegister(ctx) {
        try {
            console.log('Handling registration for user:', ctx.from.id); // Debug log
            
            const existingUser = await this.userService.findByTelegramId(ctx.from.id);
            if (existingUser) {
                console.log('User already exists'); // Debug log
                return ctx.reply(
                    '⚠️ You are already registered!\n\n' +
                    'Please login with your password using:\n' +
                    '/verify YOUR_PASSWORD',
                    Keyboards.getAuthMenu()
                );
            }

            console.log('New user, prompting for password'); // Debug log
            return ctx.reply(
                '📝 Welcome to registration!\n\n' +
                'Please set your password using this format:\n' +
                '/setpassword YOUR_PASSWORD\n\n' +
                '⚠️ Remember this password for future logins!',
                Keyboards.getAuthMenu()
            );
        } catch (error) {
            console.error('Register command error:', error);
            return ctx.reply(
                '❌ Registration failed. Please try again later.',
                Keyboards.getAuthMenu()
            );
        }
    }

    async handleSetPassword(ctx) {
        try {
            const password = ctx.message.text.split(' ')[1];
            if (!password) {
                return ctx.reply('Please provide a password: /setpassword YOUR_PASSWORD');
            }

            const token = await this.userService.register(
                ctx.from.id,
                ctx.from.username || 'user_' + ctx.from.id,
                password
            );

            await ctx.reply('✅ Registration successful!');

            return ctx.reply(
                'Welcome to Tour Booking Bot! 👋\n\n' +
                'What would you like to do?',
                Keyboards.getMainMenu()
            );
        } catch (error) {
            console.error('Set password error:', error);
            return ctx.reply('Failed to set password. Please try again.');
        }
    }

    async handleLogin(ctx) {
        try {
            const user = await this.userService.findByTelegramId(ctx.from.id);
            if (!user) {
                return ctx.reply(
                    'You are not registered yet!\n' +
                    'Please register first:',
                    Keyboards.getAuthMenu()
                );
            }
            return ctx.reply(
                '🔑 Please enter your password:\n' +
                '/verify YOUR_PASSWORD\n\n' +
                '❓ Forgot password? Use /forgot_password to reset',
                Keyboards.getAuthMenu()
            );
        } catch (error) {
            console.error('Login command error:', error);
            return ctx.reply('Login failed. Please try again later.');
        }
    }

    async handleVerify(ctx) {
        try {
            console.log('Verifying password for user:', ctx.from.id); // Debug log
            
            const password = ctx.message.text.split(' ')[1];
            if (!password) {
                return ctx.reply(
                    '⚠️ Please provide your password:\n' +
                    '/verify YOUR_PASSWORD',
                    Keyboards.getAuthMenu()
                );
            }

            console.log('Password provided, attempting verification'); // Debug log
            
            const result = await this.userService.verifyPassword(ctx.from.id, password);
            console.log('Verification result:', result.success); // Debug log
            
            if (!result.success) {
                return ctx.reply(
                    '❌ ' + result.message + '\n\n' +
                    'Please try again using:\n' +
                    '/verify YOUR_PASSWORD',
                    Keyboards.getAuthMenu()
                );
            }

            await ctx.reply('✅ Login successful!');
            
            return ctx.reply(
                `Welcome back, ${result.user.username}! 👋\n\n` +
                'What would you like to do?',
                Keyboards.getMainMenu()
            );
        } catch (error) {
            console.error('Verify password error:', error);
            return ctx.reply(
                '❌ An error occurred while verifying your password.\n' +
                'Please try again using:\n' +
                '/verify YOUR_PASSWORD',
                Keyboards.getAuthMenu()
            );
        }
    }

    async handleProfile(ctx) {
        try {
            const user = await this.userService.findByTelegramId(ctx.from.id);
            if (!user) {
                return ctx.reply('Please register or login first.', Keyboards.getAuthMenu());
            }

            const bookings = await this.bookingService.getUserBookings(user._id);
            const activeBookings = bookings.filter(b => b.status !== 'cancelled').length;

            const message = `👤 User Profile\n\n` +
                `Username: ${user.username}\n` +
                `Active Bookings: ${activeBookings}\n` +
                `Total Bookings: ${bookings.length}\n` +
                `Account Status: ${user.isRegistered ? '✅ Active' : '❌ Inactive'}\n`;

            return ctx.reply(message, Keyboards.getProfileMenu());
        } catch (error) {
            console.error('Profile error:', error);
            return ctx.reply('Failed to fetch profile.', Keyboards.getBackToMenu());
        }
    }

    async handleLogout(ctx) {
        try {
            const result = await this.userService.logout(ctx.from.id);
            if (result.success) {
                return ctx.reply(
                    '👋 You have been logged out successfully.\n' +
                    'To use the bot again, please login or register.',
                    Keyboards.getAuthMenu()
                );
            }
            return ctx.reply('Failed to logout. Please try again.', Keyboards.getBackToMenu());
        } catch (error) {
            console.error('Logout error:', error);
            return ctx.reply('Failed to logout. Please try again.', Keyboards.getBackToMenu());
        }
    }

    async handleForgotPassword(ctx) {
        try {
            const user = await this.userService.findByTelegramId(ctx.from.id);
            if (!user) {
                return ctx.reply(
                    'You are not registered yet!\n' +
                    'Please register first:',
                    Keyboards.getAuthMenu()
                );
            }

            return ctx.reply(
                '🔄 Reset Password\n\n' +
                'To reset your password, use this format:\n' +
                '/reset_password NEW_PASSWORD\n\n' +
                '⚠️ Please choose a strong password!'
            );
        } catch (error) {
            console.error('Forgot password error:', error);
            return ctx.reply('Failed to process request. Please try again later.');
        }
    }

    async handleResetPassword(ctx) {
        try {
            const newPassword = ctx.message.text.split(' ')[1];
            if (!newPassword) {
                return ctx.reply(
                    '⚠️ Please provide your new password:\n' +
                    '/reset_password NEW_PASSWORD'
                );
            }

            const result = await this.userService.resetPassword(ctx.from.id, newPassword);
            if (!result.success) {
                return ctx.reply(
                    '❌ ' + result.message,
                    Keyboards.getAuthMenu()
                );
            }

            await ctx.reply(
                '✅ Password has been reset successfully!\n\n' +
                'Please login with your new password:'
            );
            
            return ctx.reply(
                '🔑 Please enter your password:\n' +
                '/verify YOUR_PASSWORD',
                Keyboards.getAuthMenu()
            );
        } catch (error) {
            console.error('Reset password error:', error);
            return ctx.reply(
                '❌ Failed to reset password.\n' +
                'Please try again later.',
                Keyboards.getAuthMenu()
            );
        }
    }
}

module.exports = UserController; 