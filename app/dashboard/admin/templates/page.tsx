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
import { Loader2, Plus, Edit, Trash2, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'

interface ClassTemplate {
  id: string
  template_name: string
  class_name: string
  instructor_name: string
  start_time: string
  end_time: string
  max_capacity: number
  created_at: string
  updated_at: string
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [templates, setTemplates] = useState<ClassTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ClassTemplate | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const supabase = createClient()

  // Form state for adding/editing templates
  const [formData, setFormData] = useState({
    template_name: '',
    class_name: '',
    instructor_name: '',
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
      fetchTemplates()
    }
  }, [isAdmin])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('class_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTemplates(data)
      } else if (error?.code === '42P01') {
        // Table doesn't exist yet
        console.log('Class templates table not yet created')
        toast.error('Templates table not found. Please run the migration.')
      } else if (error) {
        console.error('Error fetching templates:', error)
        toast.error('Failed to load templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTemplate = async () => {
    // Validate form data
    if (!formData.template_name || !formData.class_name || !formData.instructor_name || 
        !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('class_templates')
        .insert([formData])

      if (error) throw error

      toast.success('Template added successfully')
      setIsAddDialogOpen(false)
      fetchTemplates()
      resetForm()
    } catch (error) {
      console.error('Error adding template:', error)
      toast.error('Failed to add template')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return

    // Validate form data
    if (!formData.template_name || !formData.class_name || !formData.instructor_name || 
        !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('class_templates')
        .update({
          template_name: formData.template_name,
          class_name: formData.class_name,
          instructor_name: formData.instructor_name,
          start_time: formData.start_time,
          end_time: formData.end_time,
          max_capacity: formData.max_capacity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTemplate.id)

      if (error) throw error

      toast.success('Template updated successfully')
      setIsEditDialogOpen(false)
      fetchTemplates()
      resetForm()
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('class_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      toast.success('Template deleted successfully')
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const resetForm = () => {
    setFormData({
      template_name: '',
      class_name: '',
      instructor_name: '',
      start_time: '',
      end_time: '',
      max_capacity: 10
    })
    setSelectedTemplate(null)
  }

  const openEditDialog = (template: ClassTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      template_name: template.template_name,
      class_name: template.class_name,
      instructor_name: template.instructor_name,
      start_time: template.start_time,
      end_time: template.end_time,
      max_capacity: template.max_capacity
    })
    setIsEditDialogOpen(true)
  }

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
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
            Class <span className="font-medium italic">Templates</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage reusable class templates
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none">
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Template</DialogTitle>
              <DialogDescription>
                Create a reusable class template
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="template_name">Template Name</Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., Morning Vinyasa Flow"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class_name">Class Name</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="e.g., Vinyasa Flow"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instructor_name">Instructor</Label>
                <Input
                  id="instructor_name"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                  placeholder="e.g., Sarah Johnson"
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
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTemplate}>Add Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No templates created yet</p>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <CardDescription>{template.class_name}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Instructor</span>
                    <span className="font-medium">{template.instructor_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time
                    </span>
                    <span className="font-medium">{formatTimeRange(template.start_time, template.end_time)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Capacity
                    </span>
                    <span className="font-medium">{template.max_capacity} spots</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button
                    className="w-full rounded-none"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Store template in sessionStorage to use it in the classes page
                      sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
                      router.push('/dashboard/admin/classes')
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_template_name">Template Name</Label>
              <Input
                id="edit_template_name"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              />
            </div>
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
                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 10 })}
                min="1"
                max="50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>Update Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}