variable "cloudflare_api_token" {
  description = "Scoped API token — Zone:Edit, R2:Edit, Turnstile:Edit only, not Account:Edit"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID for reportersdesk.in"
  type        = string
}

variable "vps_ipv4" {
  description = "Public IPv4 of the VPS running the CMS — provision the VPS first, then run terraform apply"
  type        = string
}

variable "domain" {
  description = "Primary domain"
  type        = string
  default     = "reportersdesk.in"
}

# Real values belong in a terraform.tfvars file that is gitignored, or in
# CI secrets passed as -var flags — never committed alongside this file.
