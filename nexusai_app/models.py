from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=100, default='Principal System Architect')
    team_role = models.CharField(max_length=50, default='Architect')
    bio = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('testing', 'Testing'),
        ('deployed', 'Deployed'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='planning')
    progress = models.IntegerField(default=20)
    tech_stack = models.JSONField(default=list)
    repo_url = models.URLField(blank=True, default='')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Requirement(models.Model):
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    TYPE_CHOICES = [
        ('functional', 'Functional'),
        ('non-functional', 'Non-Functional'),
        ('security', 'Security'),
        ('integration', 'Integration'),
    ]
    STATUS_CHOICES = [
        ('extracted', 'Extracted'),
        ('approved', 'Approved'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='requirements', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    req_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='functional')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='extracted')
    complexity = models.CharField(max_length=20, default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ArchNode(models.Model):
    NODE_TYPES = [
        ('gateway', 'API Gateway'),
        ('service', 'Microservice'),
        ('database', 'Database'),
        ('cache', 'Cache'),
        ('queue', 'Message Queue'),
        ('ai', 'AI Engine'),
        ('auth', 'Auth Service'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='arch_nodes', null=True, blank=True)
    label = models.CharField(max_length=255)
    sublabel = models.CharField(max_length=255, blank=True, default='')
    node_type = models.CharField(max_length=50, choices=NODE_TYPES, default='service')
    pos_x = models.IntegerField(default=100)
    pos_y = models.IntegerField(default=100)
    status = models.CharField(max_length=50, default='healthy')
    cpu = models.CharField(max_length=20, default='10%')
    latency = models.CharField(max_length=20, default='1.2ms')

    def __str__(self):
        return self.label

class ArchConnection(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='arch_connections', null=True, blank=True)
    from_node = models.ForeignKey(ArchNode, on_delete=models.CASCADE, related_name='outgoing_connections')
    to_node = models.ForeignKey(ArchNode, on_delete=models.CASCADE, related_name='incoming_connections')
    label = models.CharField(max_length=255, blank=True, default='')
    protocol = models.CharField(max_length=50, default='gRPC')

    def __str__(self):
        return f"{self.from_node.label} -> {self.to_node.label}"

class DatabaseTable(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='db_tables', null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    columns = models.JSONField(default=list)  # list of {name, type, pk, nullable, fk}

    def __str__(self):
        return self.name

class AgentInfo(models.Model):
    AGENT_ROLES = [
        ('Requirement Analyst', 'Requirement Analyst'),
        ('System Architect', 'System Architect'),
        ('Database Specialist', 'Database Specialist'),
        ('Code Generator', 'Code Generator'),
        ('QA & Security Auditor', 'QA & Security Auditor'),
        ('DevOps & CI/CD Specialist', 'DevOps & CI/CD Specialist'),
    ]
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=100, choices=AGENT_ROLES)
    model = models.CharField(max_length=100, default='Gemini 3.6 Flash')
    status = models.CharField(max_length=50, default='active')  # active, executing, idle
    tasks_completed = models.IntegerField(default=0)
    accuracy_rate = models.CharField(max_length=20, default='99.4%')
    avatar = models.CharField(max_length=255, default='bot')
    logs = models.JSONField(default=list)

    def __str__(self):
        return f"{self.name} ({self.role})"

class CodeFile(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='code_files', null=True, blank=True)
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=500)
    language = models.CharField(max_length=50)
    content = models.TextField()
    is_modified = models.BooleanField(default=False)

    def __str__(self):
        return self.path

class TestCase(models.Model):
    STATUS_CHOICES = [
        ('passed', 'Passed'),
        ('running', 'Running'),
        ('failed', 'Failed'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='test_cases', null=True, blank=True)
    name = models.CharField(max_length=255)
    suite = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='passed')
    coverage = models.CharField(max_length=20, default='98.5%')

    def __str__(self):
        return self.name

class TaskItem(models.Model):
    STATUS_CHOICES = [
        ('backlog', 'Backlog'),
        ('in-progress', 'In Progress'),
        ('review', 'Review'),
        ('completed', 'Completed'),
    ]
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_agent = models.CharField(max_length=100)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='backlog')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class TeamMember(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    role = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='active')

    def __str__(self):
        return self.name

class NotificationItem(models.Model):
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    title = models.CharField(max_length=255)
    message = models.TextField()
    timestamp = models.CharField(max_length=100, default='Just now')
    read = models.BooleanField(default=False)
    notif_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')

    def __str__(self):
        return self.title

class CiCdPipeline(models.Model):
    name = models.CharField(max_length=255)
    branch = models.CharField(max_length=100, default='main')
    status = models.CharField(max_length=50, default='success')
    duration = models.CharField(max_length=50, default='42s')
    triggered_by = models.CharField(max_length=100, default='NexusAI Agent')
    logs = models.JSONField(default=list)

    def __str__(self):
        return self.name

class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()

    def __str__(self):
        return f"{self.key}: {self.value}"
