'use server';

/**
 * Team management server actions (Issue 27)
 * - チーム作成
 * - チーム切り替え
 * - 招待リンク生成
 * - 招待リンクからの参加
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// ========================================
// Types
// ========================================

export type TeamRole = 'owner' | 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserTeam extends Team {
  role: TeamRole;
  joined_at: string;
}

export interface Invitation {
  id: string;
  department_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

// ========================================
// Create Team
// ========================================

export async function createTeam(name: string): Promise<{
  success: boolean;
  teamId?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'チーム名を入力してください' };
    }

    if (name.trim().length > 100) {
      return { success: false, error: 'チーム名は100文字以内で入力してください' };
    }

    // Create department
    console.log('Creating department:', { name: name.trim(), owner_id: user.id });
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .insert({
        name: name.trim(),
        owner_id: user.id,
      })
      .select('id')
      .single();

    if (deptError || !department) {
      console.error('Failed to create department:', deptError);
      return { success: false, error: `チームの作成に失敗しました: ${deptError?.message || '不明なエラー'}` };
    }

    console.log('Department created:', department);

    // Add creator as owner in user_departments
    console.log('Adding user to department:', { user_id: user.id, department_id: department.id, role: 'owner' });
    const { error: memberError } = await supabase
      .from('user_departments')
      .insert({
        user_id: user.id,
        department_id: department.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Failed to add user to department:', memberError);
      return { success: false, error: `チームメンバーの追加に失敗しました: ${memberError.message}` };
    }

    console.log('User added to department');

    // Set as current department
    console.log('Updating profile with current_department_id:', department.id);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_department_id: department.id })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update current department:', updateError);
      // Don't fail the entire operation, just log the error
    }

    console.log('Profile updated successfully');

    revalidatePath('/teams');
    revalidatePath('/');

    return { success: true, teamId: department.id };
  } catch (error) {
    console.error('Unexpected error in createTeam:', error);
    return { success: false, error: 'チームの作成中にエラーが発生しました' };
  }
}

// ========================================
// Get User Teams
// ========================================

export async function getUserTeams(): Promise<{
  success: boolean;
  teams?: UserTeam[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Get user's teams with role
    const { data: userDepartments, error: udError } = await supabase
      .from('user_departments')
      .select(
        `
        role,
        joined_at,
        departments:department_id (
          id,
          name,
          owner_id,
          created_at,
          updated_at
        )
      `
      )
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (udError) {
      console.error('Failed to fetch user teams:', udError);
      return { success: false, error: 'チーム一覧の取得に失敗しました' };
    }

    if (!userDepartments) {
      return { success: true, teams: [] };
    }

    // Transform data
    const teams: UserTeam[] = userDepartments
      .filter((ud) => ud.departments)
      .map((ud) => {
        const dept = Array.isArray(ud.departments)
          ? ud.departments[0]
          : ud.departments;
        return {
          id: dept.id,
          name: dept.name,
          owner_id: dept.owner_id,
          created_at: dept.created_at,
          updated_at: dept.updated_at,
          role: ud.role as TeamRole,
          joined_at: ud.joined_at,
        };
      });

    return { success: true, teams };
  } catch (error) {
    console.error('Unexpected error in getUserTeams:', error);
    return { success: false, error: 'チーム一覧の取得中にエラーが発生しました' };
  }
}

// ========================================
// Switch Team
// ========================================

export async function switchTeam(teamId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Verify user belongs to the team
    const { data: membership, error: memberError } = await supabase
      .from('user_departments')
      .select('id')
      .eq('user_id', user.id)
      .eq('department_id', teamId)
      .single();

    if (memberError || !membership) {
      return { success: false, error: 'このチームに所属していません' };
    }

    // Update current_department_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_department_id: teamId })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to switch team:', updateError);
      return { success: false, error: 'チームの切り替えに失敗しました' };
    }

    revalidatePath('/');
    revalidatePath('/teams');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in switchTeam:', error);
    return { success: false, error: 'チームの切り替え中にエラーが発生しました' };
  }
}

// ========================================
// Generate Invitation
// ========================================

export async function generateInvitation(
  teamId: string,
  expiresInDays: number = 7,
  maxUses: number | null = null
): Promise<{
  success: boolean;
  invitation?: Invitation;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Verify user is owner or admin
    const { data: membership, error: memberError } = await supabase
      .from('user_departments')
      .select('role')
      .eq('user_id', user.id)
      .eq('department_id', teamId)
      .single();

    if (memberError || !membership) {
      return { success: false, error: 'このチームに所属していません' };
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return {
        success: false,
        error: '招待リンクを作成する権限がありません',
      };
    }

    // Generate invitation
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .insert({
        department_id: teamId,
        token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
      })
      .select()
      .single();

    if (invError || !invitation) {
      console.error('Failed to create invitation:', invError);
      return { success: false, error: '招待リンクの作成に失敗しました' };
    }

    return { success: true, invitation };
  } catch (error) {
    console.error('Unexpected error in generateInvitation:', error);
    return {
      success: false,
      error: '招待リンクの作成中にエラーが発生しました',
    };
  }
}

// ========================================
// Join Team by Invitation
// ========================================

export async function joinTeamByInvitation(token: string): Promise<{
  success: boolean;
  teamId?: string;
  teamName?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Get invitation (bypasses RLS)
    const invitationResult = await getInvitationByToken(token);

    if (!invitationResult.success || !invitationResult.data) {
      return {
        success: false,
        error: invitationResult.error || '招待リンクが見つかりません',
      };
    }

    const { data: invitation, isExpired, isMaxUsesReached } = invitationResult;

    // Check if expired
    if (isExpired) {
      return { success: false, error: '招待リンクの有効期限が切れています' };
    }

    // Check if max uses reached
    if (isMaxUsesReached) {
      return { success: false, error: '招待リンクの利用上限に達しています' };
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('user_departments')
      .select('id')
      .eq('user_id', user.id)
      .eq('department_id', invitation.department_id)
      .single();

    if (existingMembership) {
      return { success: false, error: 'すでにこのチームに参加しています' };
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('user_departments')
      .insert({
        user_id: user.id,
        department_id: invitation.department_id,
        role: 'member',
      });

    if (memberError) {
      console.error('Failed to add user to team:', memberError);
      return { success: false, error: 'チームへの参加に失敗しました' };
    }

    // Log invitation use
    const { error: useError } = await supabase.from('invitation_uses').insert({
      invitation_id: invitation.id,
      user_id: user.id,
    });

    if (useError) {
      console.error('Failed to log invitation use:', useError);
      // Don't fail the operation
    }

    // Increment use count using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
      .from('invitations')
      .update({ use_count: invitation.use_count + 1 })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Failed to increment use count:', updateError);
      // Don't fail the operation
    }

    // Switch to new team
    await switchTeam(invitation.department_id);

    revalidatePath('/teams');
    revalidatePath('/');

    return {
      success: true,
      teamId: invitation.department_id,
      teamName: invitation.department.name,
    };
  } catch (error) {
    console.error('Unexpected error in joinTeamByInvitation:', error);
    return {
      success: false,
      error: 'チームへの参加中にエラーが発生しました',
    };
  }
}

// ========================================
// Leave Team
// ========================================

export async function leaveTeam(teamId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Check if user is the owner
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (deptError || !department) {
      return { success: false, error: 'チームが見つかりません' };
    }

    if (department.owner_id === user.id) {
      return {
        success: false,
        error: 'チームのオーナーは退出できません。チームを削除してください。',
      };
    }

    // Remove user from team
    const { error: deleteError } = await supabase
      .from('user_departments')
      .delete()
      .eq('user_id', user.id)
      .eq('department_id', teamId);

    if (deleteError) {
      console.error('Failed to leave team:', deleteError);
      return { success: false, error: 'チームからの退出に失敗しました' };
    }

    // If current team, switch to another team
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_department_id')
      .eq('id', user.id)
      .single();

    if (profile?.current_department_id === teamId) {
      // Get another team
      const { data: otherTeams } = await supabase
        .from('user_departments')
        .select('department_id')
        .eq('user_id', user.id)
        .limit(1);

      if (otherTeams && otherTeams.length > 0) {
        await switchTeam(otherTeams[0].department_id);
      } else {
        // No other teams, clear current_department_id
        await supabase
          .from('profiles')
          .update({ current_department_id: null })
          .eq('id', user.id);
      }
    }

    revalidatePath('/teams');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in leaveTeam:', error);
    return { success: false, error: 'チームからの退出中にエラーが発生しました' };
  }
}

// ========================================
// Get Current Team
// ========================================

export async function getCurrentTeam(): Promise<{
  success: boolean;
  team?: UserTeam;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Get current department
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.current_department_id) {
      return { success: true, team: undefined };
    }

    // Get team details
    const { data: userDept, error: udError } = await supabase
      .from('user_departments')
      .select(
        `
        role,
        joined_at,
        departments:department_id (
          id,
          name,
          owner_id,
          created_at,
          updated_at
        )
      `
      )
      .eq('user_id', user.id)
      .eq('department_id', profile.current_department_id)
      .single();

    if (udError || !userDept || !userDept.departments) {
      return { success: true, team: undefined };
    }

    const dept = Array.isArray(userDept.departments)
      ? userDept.departments[0]
      : userDept.departments;

    const team: UserTeam = {
      id: dept.id,
      name: dept.name,
      owner_id: dept.owner_id,
      created_at: dept.created_at,
      updated_at: dept.updated_at,
      role: userDept.role as TeamRole,
      joined_at: userDept.joined_at,
    };

    return { success: true, team };
  } catch (error) {
    console.error('Unexpected error in getCurrentTeam:', error);
    return {
      success: false,
      error: '現在のチーム情報の取得中にエラーが発生しました',
    };
  }
}

// ========================================
// Get Team Invitations
// ========================================

export async function getTeamInvitations(teamId: string): Promise<{
  success: boolean;
  invitations?: Invitation[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Verify user is owner or admin
    const { data: membership, error: memberError } = await supabase
      .from('user_departments')
      .select('role')
      .eq('user_id', user.id)
      .eq('department_id', teamId)
      .single();

    if (memberError || !membership) {
      return { success: false, error: 'このチームに所属していません' };
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return {
        success: false,
        error: '招待リンクを閲覧する権限がありません',
      };
    }

    // Get invitations
    const { data: invitations, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('department_id', teamId)
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('Failed to fetch invitations:', invError);
      return { success: false, error: '招待リンクの取得に失敗しました' };
    }

    return { success: true, invitations: invitations || [] };
  } catch (error) {
    console.error('Unexpected error in getTeamInvitations:', error);
    return {
      success: false,
      error: '招待リンクの取得中にエラーが発生しました',
    };
  }
}

// ========================================
// Update Team Name (Owner only)
// ========================================

export async function updateTeam(
  teamId: string,
  name: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'チーム名を入力してください' };
    }

    if (name.trim().length > 100) {
      return { success: false, error: 'チーム名は100文字以内で入力してください' };
    }

    // Check if user is owner of the team
    const { data: team, error: teamError } = await supabase
      .from('departments')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return { success: false, error: 'チームが見つかりません' };
    }

    if (team.owner_id !== user.id) {
      return { success: false, error: 'チーム名を変更する権限がありません' };
    }

    // Update team name
    const { error: updateError } = await supabase
      .from('departments')
      .update({ name: name.trim() })
      .eq('id', teamId);

    if (updateError) {
      console.error('Failed to update team:', updateError);
      return { success: false, error: 'チーム名の変更に失敗しました' };
    }

    revalidatePath('/teams');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in updateTeam:', error);
    return { success: false, error: 'チーム名の変更中にエラーが発生しました' };
  }
}

// ========================================
// Delete Team (Owner only)
// ========================================

export async function deleteTeam(teamId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Check if user is owner of the team
    const { data: team, error: teamError } = await supabase
      .from('departments')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return { success: false, error: 'チームが見つかりません' };
    }

    if (team.owner_id !== user.id) {
      return { success: false, error: 'チームを削除する権限がありません' };
    }

    // Clear current_department_id for all users in this team
    const { error: clearError } = await supabase
      .from('profiles')
      .update({ current_department_id: null })
      .eq('current_department_id', teamId);

    if (clearError) {
      console.error('Failed to clear current_department_id:', clearError);
      // Continue anyway - not critical
    }

    // Delete the team (CASCADE will delete related records)
    const { error: deleteError } = await supabase
      .from('departments')
      .delete()
      .eq('id', teamId);

    if (deleteError) {
      console.error('Failed to delete team:', deleteError);
      return { success: false, error: `チームの削除に失敗しました: ${deleteError.message}` };
    }

    revalidatePath('/teams');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteTeam:', error);
    return { success: false, error: 'チームの削除中にエラーが発生しました' };
  }
}

// ========================================
// Get Invitation by Token (bypasses RLS)
// ========================================

export interface InvitationDetails {
  id: string;
  department_id: string;
  token: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
  department: {
    id: string;
    name: string;
  };
}

export async function getInvitationByToken(
  token: string
): Promise<{
  success: boolean;
  data?: InvitationDetails;
  error?: string;
  isExpired?: boolean;
  isMaxUsesReached?: boolean;
}> {
  try {
    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    const { data: invitation, error } = await adminClient
      .from('invitations')
      .select(
        `
        id,
        department_id,
        token,
        expires_at,
        max_uses,
        use_count,
        department:departments!department_id (
          id,
          name
        )
      `
      )
      .eq('token', token)
      .single();

    if (error || !invitation) {
      console.error('Failed to fetch invitation:', error);
      return { success: false, error: '招待リンクが見つかりません' };
    }

    // Check if expired
    const isExpired = new Date(invitation.expires_at) < new Date();

    // Check if max uses reached
    const isMaxUsesReached =
      invitation.max_uses !== null &&
      invitation.use_count >= invitation.max_uses;

    const department = Array.isArray(invitation.department)
      ? invitation.department[0]
      : invitation.department;

    if (!department) {
      return { success: false, error: 'チーム情報が見つかりません' };
    }

    return {
      success: true,
      data: {
        id: invitation.id,
        department_id: invitation.department_id,
        token: invitation.token,
        expires_at: invitation.expires_at,
        max_uses: invitation.max_uses,
        use_count: invitation.use_count,
        department: {
          id: department.id,
          name: department.name,
        },
      },
      isExpired,
      isMaxUsesReached,
    };
  } catch (error) {
    console.error('Unexpected error in getInvitationByToken:', error);
    return { success: false, error: '招待リンクの取得に失敗しました' };
  }
}

// ========================================
// Accept Invitation
// ========================================

export async function acceptInvitation(token: string): Promise<{
  success: boolean;
  error?: string;
  teamId?: string;
}> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: '認証に失敗しました' };
    }

    // Get invitation details (bypasses RLS)
    const invitationResult = await getInvitationByToken(token);

    if (!invitationResult.success || !invitationResult.data) {
      return {
        success: false,
        error: invitationResult.error || '招待リンクが見つかりません',
      };
    }

    const { data: invitation, isExpired, isMaxUsesReached } = invitationResult;

    // Check if expired
    if (isExpired) {
      return { success: false, error: '招待リンクの有効期限が切れています' };
    }

    // Check if max uses reached
    if (isMaxUsesReached) {
      return { success: false, error: '招待リンクの使用回数が上限に達しています' };
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('user_departments')
      .select('id')
      .eq('user_id', user.id)
      .eq('department_id', invitation.department_id)
      .single();

    if (existingMembership) {
      return {
        success: false,
        error: 'すでにこのチームのメンバーです',
      };
    }

    // Add user to team
    const { error: insertError } = await supabase
      .from('user_departments')
      .insert({
        user_id: user.id,
        department_id: invitation.department_id,
        role: 'member',
      });

    if (insertError) {
      console.error('Failed to add user to team:', insertError);
      return { success: false, error: 'チームへの参加に失敗しました' };
    }

    // Log invitation use
    const { error: logError } = await supabase
      .from('invitation_uses')
      .insert({
        invitation_id: invitation.id,
        user_id: user.id,
      });

    if (logError) {
      console.error('Failed to log invitation use:', logError);
      // Continue anyway - not critical
    }

    // Increment use count using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { error: incrementError } = await adminClient
      .from('invitations')
      .update({ use_count: invitation.use_count + 1 })
      .eq('id', invitation.id);

    if (incrementError) {
      console.error('Failed to increment use count:', incrementError);
      // Continue anyway - not critical
    }

    revalidatePath('/teams');
    revalidatePath('/');

    return { success: true, teamId: invitation.department_id };
  } catch (error) {
    console.error('Unexpected error in acceptInvitation:', error);
    return { success: false, error: '招待の受け入れに失敗しました' };
  }
}
