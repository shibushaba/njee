import { PageHeader } from '../components/ui/PageHeader'
import { NotificationSettings } from '../components/notifications/NotificationSettings'

export function NotificationSettingsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="Warm, sparse, yours to tune." />
      <NotificationSettings />
    </div>
  )
}
