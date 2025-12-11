"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { withAuth } from "@/lib/auth"
import { getProfile, updateProfile, changePassword, ProfileResponse } from "@/lib/api"
import { ApiError } from "@/lib/errors"

function SettingsPage() {
  // Profile state
  const [, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  
  // Profile form state
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Validation errors
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; email?: string }>({})
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string }>({})

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile()
        setProfile(data)
        setFullName(data.username || "")
        setEmail(data.email || "")
        setBio(data.avatar_url || "") // Using avatar_url for bio temporarily
      } catch (error) {
        console.error("Failed to fetch profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password strength validation
  const isStrongPassword = (password: string): boolean => {
    return password.length >= 8
  }

  // Validate profile form
  const validateProfile = (): boolean => {
    const errors: { fullName?: string; email?: string } = {}
    
    if (!fullName.trim()) {
      errors.fullName = "Full name is required"
    }
    
    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address"
    }
    
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate password form
  const validatePassword = (): boolean => {
    const errors: { current?: string; new?: string; confirm?: string } = {}
    
    if (!currentPassword) {
      errors.current = "Current password is required"
    }
    
    if (!newPassword) {
      errors.new = "New password is required"
    } else if (!isStrongPassword(newPassword)) {
      errors.new = "Password must be at least 8 characters"
    }
    
    if (!confirmPassword) {
      errors.confirm = "Please confirm your new password"
    } else if (newPassword !== confirmPassword) {
      errors.confirm = "Passwords do not match"
    }
    
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!validateProfile()) return
    
    setIsSavingProfile(true)
    try {
      await updateProfile({
        username: fullName,
        email: email,
        bio: bio || undefined,
      })
      toast.success("Profile updated successfully")
      // Refresh profile data
      const updatedProfile = await getProfile()
      setProfile(updatedProfile)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "DUPLICATE_EMAIL") {
          setProfileErrors({ email: "This email is already in use" })
        } else if (error.code === "DUPLICATE_USERNAME") {
          setProfileErrors({ fullName: "This username is already taken" })
        } else {
          toast.error(error.getUserMessage())
        }
      } else {
        toast.error("Failed to update profile")
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Handle password change
  const handleChangePassword = async () => {
    if (!validatePassword()) return
    
    setIsSavingPassword(true)
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast.success("Password changed successfully")
      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordErrors({})
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "INVALID_CREDENTIALS") {
          setPasswordErrors({ current: "Current password is incorrect" })
        } else if (error.code === "WEAK_PASSWORD") {
          setPasswordErrors({ new: "Password is too weak. Use at least 8 characters." })
        } else {
          toast.error(error.getUserMessage())
        }
      } else {
        toast.error("Failed to change password")
      }
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="w-6 h-6 text-primary" />
              </div>
              Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground">
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (profileErrors.fullName) {
                      setProfileErrors({ ...profileErrors, fullName: undefined })
                    }
                  }}
                  className={`bg-muted/50 border-input text-foreground ${
                    profileErrors.fullName ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your full name"
                />
                {profileErrors.fullName && (
                  <p className="text-sm text-red-500">{profileErrors.fullName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (profileErrors.email) {
                      setProfileErrors({ ...profileErrors, email: undefined })
                    }
                  }}
                  className={`bg-muted/50 border-input text-foreground ${
                    profileErrors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your email"
                />
                {profileErrors.email && (
                  <p className="text-sm text-red-500">{profileErrors.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-foreground">
                Bio
              </Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
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
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-foreground">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  if (passwordErrors.current) {
                    setPasswordErrors({ ...passwordErrors, current: undefined })
                  }
                }}
                placeholder="••••••••"
                className={`bg-muted/50 border-input text-foreground placeholder:text-muted-foreground ${
                  passwordErrors.current ? "border-red-500" : ""
                }`}
              />
              {passwordErrors.current && (
                <p className="text-sm text-red-500">{passwordErrors.current}</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (passwordErrors.new) {
                      setPasswordErrors({ ...passwordErrors, new: undefined })
                    }
                  }}
                  placeholder="••••••••"
                  className={`bg-muted/50 border-input text-foreground placeholder:text-muted-foreground ${
                    passwordErrors.new ? "border-red-500" : ""
                  }`}
                />
                {passwordErrors.new && (
                  <p className="text-sm text-red-500">{passwordErrors.new}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (passwordErrors.confirm) {
                      setPasswordErrors({ ...passwordErrors, confirm: undefined })
                    }
                  }}
                  placeholder="••••••••"
                  className={`bg-muted/50 border-input text-foreground placeholder:text-muted-foreground ${
                    passwordErrors.confirm ? "border-red-500" : ""
                  }`}
                />
                {passwordErrors.confirm && (
                  <p className="text-sm text-red-500">{passwordErrors.confirm}</p>
                )}
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isSavingPassword}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email updates about new uploads</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded bg-muted/50 border-input"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified about important events</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded bg-muted/50 border-input"
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">Currently using dark theme</p>
                </div>
                <Button
                  variant="outline"
                  className="border-input text-muted-foreground hover:bg-accent"
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
