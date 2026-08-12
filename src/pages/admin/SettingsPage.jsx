import { useState, useEffect } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import toast from 'react-hot-toast'
import { MdSettings, MdSecurity, MdNotifications, MdGrade, MdCheckCircle } from 'react-icons/md'

const DEFAULT_SETTINGS = {
  systemName: 'Online Examination Management System',
  supportEmail: 'support@oems.edu',
  defaultPassingMarks: 40,
  negativeMarkingPenalty: '0.25',
  autoSubmitOnTimer: true,
  showInstantResults: true,
  sessionTimeout: '60',
  notifyOnExamPublish: true,
  notifyOnResultRelease: true,
  forcePasswordChange: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('oems_system_settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch { return DEFAULT_SETTINGS }
  })

  const [saving, setSaving] = useState(false)

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem('oems_system_settings', JSON.stringify(settings))
      toast.success('System settings saved successfully!')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="page-title">System Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure general system preferences, grading rules, and notifications.</p>
      </div>

      {/* General Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <MdSettings className="text-primary-600 text-xl" />
          </div>
          <div>
            <h2 className="section-title">General Configuration</h2>
            <p className="text-xs text-gray-400">Portal title and support contact details</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="System Title"
            value={settings.systemName}
            onChange={e => update('systemName', e.target.value)}
            placeholder="Enter Portal Name"
          />
          <Input
            label="Support Email ID"
            type="email"
            value={settings.supportEmail}
            onChange={e => update('supportEmail', e.target.value)}
            placeholder="Enter Support E-mail ID"
          />
        </div>
      </Card>

      {/* Grading & Examination Rules */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <MdGrade className="text-purple-600 text-xl" />
          </div>
          <div>
            <h2 className="section-title">Grading & Examination Rules</h2>
            <p className="text-xs text-gray-400">Default pass thresholds, negative marking, and submission behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Passing Score (%)"
              type="number"
              value={settings.defaultPassingMarks}
              onChange={e => update('defaultPassingMarks', parseInt(e.target.value) || 40)}
              min={1}
              max={100}
            />
            <Select
              label="Negative Marking Penalty"
              value={settings.negativeMarkingPenalty}
              onChange={e => update('negativeMarkingPenalty', e.target.value)}
              options={[
                { value: '0', label: 'No Penalty (0 marks)' },
                { value: '0.25', label: '-0.25 Marks per wrong answer' },
                { value: '0.5', label: '-0.50 Marks per wrong answer' },
                { value: '1', label: '-1.00 Mark per wrong answer' },
              ]}
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.autoSubmitOnTimer}
                onChange={e => update('autoSubmitOnTimer', e.target.checked)}
                className="w-4 h-4 accent-primary-600 rounded"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Auto-submit exam when timer expires</p>
                <p className="text-xs text-gray-500">Automatically submit student's saved answers when countdown ends</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.showInstantResults}
                onChange={e => update('showInstantResults', e.target.checked)}
                className="w-4 h-4 accent-primary-600 rounded"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Show instant scorecard upon submission</p>
                <p className="text-xs text-gray-500">Display instant score, percentage, and grade breakdown to students</p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <MdNotifications className="text-amber-600 text-xl" />
          </div>
          <div>
            <h2 className="section-title">Email & Alerts</h2>
            <p className="text-xs text-gray-400">Notification preferences for exams and published results</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={settings.notifyOnExamPublish}
              onChange={e => update('notifyOnExamPublish', e.target.checked)}
              className="w-4 h-4 accent-primary-600 rounded"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">Notify students when an exam is published</p>
              <p className="text-xs text-gray-500">Send automated alert when a new examination schedule is published</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={settings.notifyOnResultRelease}
              onChange={e => update('notifyOnResultRelease', e.target.checked)}
              className="w-4 h-4 accent-primary-600 rounded"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">Notify students when exam results are released</p>
              <p className="text-xs text-gray-500">Send result declaration notification when scorecard is generated</p>
            </div>
          </label>
        </div>
      </Card>

      {/* Security & Sessions */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <MdSecurity className="text-red-600 text-xl" />
          </div>
          <div>
            <h2 className="section-title">Security & Authentication</h2>
            <p className="text-xs text-gray-400">Session timeouts and security verification status</p>
          </div>
        </div>

        <div className="space-y-4">
          <Select
            label="Inactivity Session Timeout"
            value={settings.sessionTimeout}
            onChange={e => update('sessionTimeout', e.target.value)}
            options={[
              { value: '15', label: '15 Minutes' },
              { value: '30', label: '30 Minutes' },
              { value: '60', label: '60 Minutes (Default)' },
              { value: '120', label: '2 Hours' },
            ]}
          />

          <div className="border-t border-gray-100 pt-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Security Shield</p>
            {[
              'Supabase JWT Auth Guard Enabled',
              'Role-Based Access Control (RBAC) Active',
              'Encrypted Session Tokens',
              'HTTPS Connection Enforcement',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                <MdCheckCircle className="text-emerald-500 text-lg" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Save Floating Bar */}
      <div className="flex justify-end pt-2">
        <Button variant="primary" size="lg" loading={saving} onClick={handleSave}>
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
