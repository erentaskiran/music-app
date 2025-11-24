"use client"

import { motion } from "framer-motion"
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { withAuth } from "@/lib/auth"

function SettingsPage() {
  const handleSave = () => {
    toast.success("Settings saved successfully")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <SettingsIcon className="w-6 h-6" />
              </div>
              Settings
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-200">
                  Full Name
                </Label>
                <Input
                  id="name"
                  defaultValue="Admin User"
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="admin@musicly.com"
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-200">
                Bio
              </Label>
              <Input
                id="bio"
                placeholder="Tell us about yourself"
                className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-gray-200">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-200">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-200">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Update Password
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
              <div>
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive email updates about new uploads</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded bg-[#1a1a1a] border-gray-700"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a1a] border border-gray-800">
              <div>
                <p className="font-medium text-white">Push Notifications</p>
                <p className="text-sm text-gray-400">Get notified about important events</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded bg-[#1a1a1a] border-gray-700"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-white">Theme</p>
                  <p className="text-sm text-gray-400">Currently using dark theme</p>
                </div>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(SettingsPage)
