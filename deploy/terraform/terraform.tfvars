aws_region        = "eu-north-1"
project_name      = "portfolio"
cluster_name      = "portfolio"
domain_name       = "manishbista11.com.np"
github_repository = "m-anishh/manishh"
github_branch     = "main"

# SSH to the bastion, locked to your known locations (home + office).
# Add/replace "<ip>/32" entries when an ISP IP changes, then re-apply.
ssh_allowed_cidrs = [
  "103.192.78.227/32", # location 1
  "27.34.73.230/32",   # location 2
]
