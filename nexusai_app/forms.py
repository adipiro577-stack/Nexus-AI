from django import forms
from .models import Project, Requirement, ArchNode, DatabaseTable, TaskItem, SystemSetting, UserProfile
from django.contrib.auth.models import User

class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'description', 'category', 'status', 'repo_url']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'description': forms.Textarea(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none', 'rows': 3}),
            'category': forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'status': forms.Select(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'repo_url': forms.URLInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
        }

class RequirementForm(forms.ModelForm):
    class Meta:
        model = Requirement
        fields = ['title', 'description', 'priority', 'req_type', 'complexity']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'description': forms.Textarea(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none', 'rows': 3}),
            'priority': forms.Select(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'req_type': forms.Select(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'complexity': forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
        }

class TaskForm(forms.ModelForm):
    class Meta:
        model = TaskItem
        fields = ['title', 'description', 'assigned_agent', 'priority', 'status']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'description': forms.Textarea(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none', 'rows': 3}),
            'assigned_agent': forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'priority': forms.Select(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
            'status': forms.Select(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:border-[#C5A059] outline-none'}),
        }

class LoginForm(forms.Form):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3.5 py-2.5 text-white focus:border-[#C5A059] outline-none', 'placeholder': 'Username or Email'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3.5 py-2.5 text-white focus:border-[#C5A059] outline-none', 'placeholder': '••••••••'}))

class RegisterForm(forms.Form):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3.5 py-2.5 text-white focus:border-[#C5A059] outline-none', 'placeholder': 'alexandra_vance'}))
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3.5 py-2.5 text-white focus:border-[#C5A059] outline-none', 'placeholder': 'alexandra@nexus.ai'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3.5 py-2.5 text-white focus:border-[#C5A059] outline-none', 'placeholder': '••••••••'}))
    role = forms.CharField(initial='Principal System Architect', widget=forms.TextInput(attrs={'class': 'w-full bg-[#121212] border border-white/10 rounded-lg px-3.5 py-2.5 text-white focus:border-[#C5A059] outline-none'}))
