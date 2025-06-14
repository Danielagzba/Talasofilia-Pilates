'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/auth-context'
import { useAdmin } from '../../../../hooks/use-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog'
import { createClient } from '../../../../lib/supabase'
import { Loader2, Plus, Edit, Trash2, Users, Calendar, Save } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ClassSchedule {
  id: string
  class_name: string
  instructor_name: string
  class_date: string
  start_time: string
  end_time: string
  max_capacity: number
  current_bookings: number
  is_cancelled: boolean
  class_bookings?: any[]
}

interface ClassTemplate {
  id: string
  template_name: string
  class_name: string
  instructor_name: string
  start_time: string
  end_time: string
  max_capacity: number
}

export default function ManageClassesPage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [classes, setClasses] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<ClassSchedule | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [templates, setTemplates] = useState<ClassTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templateName, setTemplateName] = useState('')
  const supabase = createClient()

  // Form state for adding/editing classes
  const [formData, setFormData] = useState({
    class_name: '',
    instructor_name: '',
    class_date: '',
    start_time: '',
    end_time: '',
    max_capacity: 10
  })

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  useEffect(() => {
    if (isAdmin) {
      fetchClasses()
      fetchTemplates()
      
      // Check if there's a template to load from the templates page
      const storedTemplate = sessionStorage.getItem('selectedTemplate')
      if (storedTemplate) {
        const template = JSON.parse(storedTemplate)
        
        setFormData({
          class_name: template.class_name,
          instructor_name: template.instructor_name,
          class_date: new Date().toISOString().split('T')[0], // Today's date
          start_time: template.start_time,
          end_time: template.end_time,
          max_capacity: template.max_capacity
        })
        
        // Open the add dialog
        setIsAddDialogOpen(true)
        
        // Clear the stored template
        sessionStorage.removeItem('selectedTemplate')
        
        toast.success(`Template "${template.template_name}" loaded`)
      }
    }
  }, [isAdmin])

  const fetchClasses = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .gte('class_date', today)
        .order('class_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (!error && data) {
        setClasses(data)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('class_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTemplates(data)
      } else if (error?.code === '42P01') {
        // Table doesn't exist yet - this is okay
        console.log('Class templates table not yet created')
      } else if (error) {
        console.error('Error fetching templates:', error)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Please set start and end times before saving as template')
      return
    }

    try {
      const { error } = await supabase
        .from('class_templates')
        .insert([{
          template_name: templateName,
          class_name: formData.class_name,
          instructor_name: formData.instructor_name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          max_capacity: formData.max_capacity
        }])

      if (error) throw error

      toast.success('Template saved successfully')
      setIsTemplateDialogOpen(false)
      setTemplateName('')
      fetchTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setFormData({
      ...formData,
      class_name: template.class_name,
      instructor_name: template.instructor_name,
      start_time: template.start_time,
      end_time: template.end_time,
      max_capacity: template.max_capacity
    })
    
    toast.success(`Template "${template.template_name}" loaded`)
  }


  const handleAddClass = async () => {
    // Validate form data
    if (!formData.class_name || !formData.instructor_name || !formData.class_date || 
        !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('class_schedules')
        .insert([formData])

      if (error) throw error

      toast.success('Class added successfully')
      setIsAddDialogOpen(false)
      fetchClasses()
      resetForm()
      setSelectedTemplate('') // Reset template selection
    } catch (error) {
      console.error('Error adding class:', error)
      toast.error('Failed to add class')
    }
  }

  const handleUpdateClass = async () => {
    if (!selectedClass) return

    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({
          class_name: formData.class_name,
          instructor_name: formData.instructor_name,
          class_date: formData.class_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          max_capacity: formData.max_capacity
        })
        .eq('id', selectedClass.id)

      if (error) throw error

      toast.success('Class updated successfully')
      setIsEditDialogOpen(false)
      fetchClasses()
      resetForm()
    } catch (error) {
      console.error('Error updating class:', error)
      toast.error('Failed to update class')
    }
  }

  const handleCancelClass = async (classId: string) => {
    if (!confirm('Are you sure you want to cancel this class?')) return

    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({ is_cancelled: true })
        .eq('id', classId)

      if (error) throw error

      toast.success('Class cancelled successfully')
      fetchClasses()
    } catch (error) {
      console.error('Error cancelling class:', error)
      toast.error('Failed to cancel class')
    }
  }

  const handleUncancelClass = async (classId: string) => {
    if (!confirm('Are you sure you want to un-cancel this class?')) return

    try {
      const { error } = await supabase
        .from('class_schedules')
        .update({ is_cancelled: false })
        .eq('id', classId)

      if (error) throw error

      toast.success('Class un-cancelled successfully')
      fetchClasses()
    } catch (error) {
      console.error('Error un-cancelling class:', error)
      toast.error('Failed to un-cancel class')
    }
  }

  const resetForm = () => {
    setFormData({
      class_name: '',
      instructor_name: '',
      class_date: '',
      start_time: '',
      end_time: '',
      max_capacity: 10
    })
    setSelectedClass(null)
  }

  const openEditDialog = (classItem: ClassSchedule) => {
    setSelectedClass(classItem)
    setFormData({
      class_name: classItem.class_name,
      instructor_name: classItem.instructor_name,
      class_date: classItem.class_date,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      max_capacity: classItem.max_capacity
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = async (classItem: ClassSchedule) => {
    setSelectedClass(classItem)
    
    // Fetch bookings for this specific class
    try {
      // First fetch the bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('class_bookings')
        .select('*')
        .eq('schedule_id', classItem.id)
        .eq('booking_status', 'confirmed')

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
        return
      }

      // Then fetch user profiles for each booking
      if (bookings && bookings.length > 0) {
        const userIds = bookings.map(b => b.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name')
          .in('id', userIds)

        if (!profilesError && profiles) {
          // Map profiles to bookings
          const bookingsWithProfiles = bookings.map(booking => ({
            ...booking,
            user_profiles: profiles.find(p => p.id === booking.user_id)
          }))
          
          console.log('Bookings with profiles:', bookingsWithProfiles)
          setSelectedClass({
            ...classItem,
            class_bookings: bookingsWithProfiles
          })
          setIsViewDialogOpen(true)
          return
        }
      }

      // If no bookings, still open the dialog
      setSelectedClass({
        ...classItem,
        class_bookings: []
      })
      setIsViewDialogOpen(true)
    } catch (error) {
      console.error('Error fetching class bookings:', error)
      // Still open dialog on error
      setSelectedClass({
        ...classItem,
        class_bookings: []
      })
      setIsViewDialogOpen(true)
    }
  }

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-light">
            Manage <span className="font-medium italic">Classes</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add, edit, and manage class schedules
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Create a new class schedule
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="class_name">Class Name</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instructor_name">Instructor</Label>
                <Input
                  id="instructor_name"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class_date">Date</Label>
                <Input
                  id="class_date"
                  type="date"
                  value={formData.class_date}
                  onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_capacity">Max Capacity</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                />
              </div>
              {templates.length > 0 && (
                <div className="grid gap-2">
                  <Label>Load from Template</Label>
                  <select
                    className="h-10 w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value)
                      if (e.target.value) {
                        handleLoadTemplate(e.target.value)
                      }
                    }}
                  >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.template_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    Save as Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save as Template</DialogTitle>
                    <DialogDescription>
                      Save this class configuration as a template for future use
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="template_name">Template Name</Label>
                      <Input
                        id="template_name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Morning Vinyasa Flow"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveAsTemplate}>Save Template</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1 sm:flex-initial">
                  Cancel
                </Button>
                <Button onClick={handleAddClass} className="flex-1 sm:flex-initial">
                  Add Class
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {classes.map((classItem) => {
          return (
            <Card key={classItem.id} className={classItem.is_cancelled ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {classItem.class_name}
                      {classItem.is_cancelled && (
                        <span className="ml-2 text-sm text-red-600">(Cancelled)</span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(classItem.class_date), 'EEEE, MMMM d, yyyy')} • 
                      {classItem.start_time} - {classItem.end_time}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewDialog(classItem)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      View ({Math.max(0, classItem.current_bookings)}/{classItem.max_capacity})
                    </Button>
                    {!classItem.is_cancelled ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(classItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClass(classItem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUncancelClass(classItem.id)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Un-cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Instructor</p>
                    <p className="font-medium">{classItem.instructor_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capacity</p>
                    <p className="font-medium">{Math.max(0, classItem.current_bookings)}/{classItem.max_capacity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available Spots</p>
                    <p className="font-medium">{Math.max(0, Math.min(classItem.max_capacity, classItem.max_capacity - classItem.current_bookings))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_class_name">Class Name</Label>
              <Input
                id="edit_class_name"
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_instructor_name">Instructor</Label>
              <Input
                id="edit_instructor_name"
                value={formData.instructor_name}
                onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_class_date">Date</Label>
              <Input
                id="edit_class_date"
                type="date"
                value={formData.class_date}
                onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_start_time">Start Time</Label>
                <Input
                  id="edit_start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_end_time">End Time</Label>
                <Input
                  id="edit_end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_max_capacity">Max Capacity</Label>
              <Input
                id="edit_max_capacity"
                type="number"
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClass}>Update Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Class Participants</DialogTitle>
            <DialogDescription>
              {selectedClass?.class_name} - {selectedClass && format(new Date(selectedClass.class_date), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedClass?.class_bookings?.filter((b: any) => b.booking_status === 'confirmed').length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No participants yet</p>
            ) : (
              <div className="space-y-2">
                {selectedClass?.class_bookings
                  ?.filter((b: any) => b.booking_status === 'confirmed')
                  .map((booking: any, index: number) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-stone-50 rounded hover:bg-stone-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{index + 1}.</span>
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-left"
                          onClick={() => router.push(`/dashboard/admin/users/${booking.user_id}`)}
                        >
                          {booking.user_profiles?.display_name || 'Unknown User'}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}