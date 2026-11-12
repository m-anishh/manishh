variable "aws_region" {
  description = "AWS region for the portfolio infrastructure."
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Short project name used in AWS resource names."
  type        = string
  default     = "portfolio"
}

variable "cluster_name" {
  description = "EKS cluster name."
  type        = string
  default     = "portfolio"
}

variable "domain_name" {
  description = "Public hostname served by the ALB."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in owner/name form, for example m-anishh/MNBVCXZ."
  type        = string
}

variable "github_branch" {
  description = "GitHub branch allowed to assume the deployment role."
  type        = string
  default     = "main"
}

variable "node_instance_types" {
  description = "Managed node instance types."
  type        = list(string)
  default     = ["t3.small"]
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 3
}

variable "node_desired_size" {
  type    = number
  default = 2
}
