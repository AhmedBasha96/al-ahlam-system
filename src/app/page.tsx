import { getAllUsers, setMockUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  async function handleLogin(formData: FormData) {
    'use server';
    try {
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;

      console.log(`[Login] Attempting login for: ${username}`);
      const users = await getAllUsers();
      const user = users.find((u: any) => u.username === username);

      if (user && password) {
        if (user.username === 'admin' && password !== '12345') {
          redirect('/?error=wrongpassword');
          return;
        }

        console.log(`[Login] Success for ${username}. Setting mock user and redirecting...`);
        await setMockUser(user.id, user.role, (user as any).agencyId);
        redirect('/dashboard');
      } else {
        redirect('/?error=invalid');
      }
    } catch (error: any) {
      if (error.message === 'NEXT_REDIRECT') throw error; // Handle redirects in server actions
      console.error('[Login] Error during handleLogin:', error);
      const message = error.message || 'Unknown server error';
      redirect(`/?error=${encodeURIComponent(message)}`);
    }
  }

  const searchParams = await props.searchParams;
  const error = searchParams.error as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
            {error === 'invalid' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' :
              error === 'wrongpassword' ? 'كلمة المرور غير صحيحة' :
                `خطأ في الخادم: ${error}`}
          </div>
        )}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="Al-Ahlam Logo"
              width={128}
              height={128}
              className="object-contain rounded-full shadow-md"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">الاحلام للتوكيلات</h1>
          <p className="text-gray-600">نظام إدارة التوكيلات والمبيعات</p>
        </div>

        <form action={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              name="username"
              required
              placeholder="أدخل اسم المستخدم"
              className="w-full border-2 border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="أدخل كلمة المرور"
              className="w-full border-2 border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition shadow-lg hover:shadow-xl"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 font-bold mb-2">حسابات تجريبية:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• <strong>admin</strong> - المدير العام (كلمة المرور: 12345)</li>
            <li>• <strong>manager_ali</strong> - مدير توكيلات</li>
            <li>• <strong>ahmed_sales</strong> - محاسب</li>
            <li>• <strong>kareem_rep</strong> - مندوب مبيعات</li>
          </ul>
          <p className="text-[10px] text-blue-600 mt-2">باقي الحسابات: أي كلمة مرور تعمل</p>
        </div>
      </div>
    </div>
  );
}
