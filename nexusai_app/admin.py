from django.contrib import admin
from .models import (
    UserProfile, Project, Requirement, ArchNode, ArchConnection, DatabaseTable, ProjectDatabaseDesign,
    AgentInfo, CodeFile, TestCase, TaskItem, TeamMember, NotificationItem, CiCdPipeline, SystemSetting
)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'progress', 'created_at')
    search_fields = ('name', 'category')
    list_filter = ('status', 'category')

@admin.register(Requirement)
class RequirementAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'priority', 'req_type', 'status')
    list_filter = ('priority', 'req_type', 'status')

@admin.register(AgentInfo)
class AgentInfoAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'status', 'accuracy_rate', 'tasks_completed')

admin.site.register(UserProfile)
admin.site.register(ArchNode)
admin.site.register(ArchConnection)
admin.site.register(DatabaseTable)
admin.site.register(CodeFile)
admin.site.register(TestCase)
admin.site.register(TaskItem)
admin.site.register(TeamMember)
admin.site.register(NotificationItem)
admin.site.register(CiCdPipeline)
admin.site.register(SystemSetting)

admin.site.register(ProjectDatabaseDesign)
